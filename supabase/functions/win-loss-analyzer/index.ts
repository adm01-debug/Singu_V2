import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "../../../src/integrations/supabase/types.ts";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

interface AggregateRow {
  outcome: string;
  count: number;
  total_value: number;
  avg_cycle: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: scopedCorsHeaders(req) });

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const limited = limiter.check(userId, req);
    if (limited) return limited;

    const vw = validate(rawBody ?? {}, {
      period_days: { type: 'integer', min: 1, max: 730 },
    });
    if (!vw.ok) return new Response(JSON.stringify({ error: vw.error }), { status: 400, headers: { ...scopedCorsHeaders(req), 'Content-Type': 'application/json' } });
    const period_days = (vw.data.period_days as number | undefined) ?? 90;
    const periodStart = new Date(Date.now() - period_days * 86400 * 1000).toISOString();
    const periodEnd = new Date().toISOString();

    // Fetch records with reason labels joined — eliminates a second round-trip
    const { data: records, error: recErr } = await supabase
      .from("win_loss_records")
      .select("outcome, deal_value, sales_cycle_days, competitor_id, primary_reason_id, win_loss_reasons(id, label, category)")
      .eq("user_id", userId)
      .gte("recorded_at", periodStart);

    if (recErr) throw recErr;

    const list = records ?? [];
    const won = list.filter((r) => r.outcome === "won");
    const lost = list.filter((r) => r.outcome === "lost");
    const totalDecided = won.length + lost.length;
    const winRate = totalDecided > 0 ? (won.length / totalDecided) * 100 : 0;
    const avgWonValue = won.length > 0
      ? won.reduce((s, r) => s + Number(r.deal_value || 0), 0) / won.length
      : 0;

    // Top reasons — labels come from the joined win_loss_reasons row
    const reasonCounts = new Map<string, { won: number; lost: number; label: string }>();
    list.forEach((r) => {
      if (!r.primary_reason_id) return;
      const label = r.win_loss_reasons?.label ?? "?";
      const cur = reasonCounts.get(r.primary_reason_id) ?? { won: 0, lost: 0, label };
      if (r.outcome === "won") cur.won++;
      if (r.outcome === "lost") cur.lost++;
      reasonCounts.set(r.primary_reason_id, cur);
    });

    const topLossReasons = [...reasonCounts.entries()]
      .map(([id, c]) => ({ id, label: c.label, count: c.lost }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Competitors
    const compCounts = new Map<string, { won: number; lost: number }>();
    list.forEach((r) => {
      if (!r.competitor_id) return;
      const cur = compCounts.get(r.competitor_id) ?? { won: 0, lost: 0 };
      if (r.outcome === "won") cur.won++;
      if (r.outcome === "lost") cur.lost++;
      compCounts.set(r.competitor_id, cur);
    });

    const aggregate = {
      period_days,
      total_records: list.length,
      won: won.length,
      lost: lost.length,
      win_rate: Number(winRate.toFixed(1)),
      avg_won_value: Number(avgWonValue.toFixed(2)),
      top_loss_reasons: topLossReasons,
      competitor_count: compCounts.size,
    };

    // Build prompt
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ aggregate, insights: [], warning: "LOVABLE_API_KEY not configured" }),
        { headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    if (list.length < 3) {
      return new Response(
        JSON.stringify({ aggregate, insights: [], message: "Dados insuficientes para gerar insights (mínimo 3 registros)" }),
        { headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } },
      );
    }

    const aiResp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Você é um analista sênior de vendas. Analise dados de win/loss e gere 3 a 5 insights acionáveis. Responda em português.",
          },
          {
            role: "user",
            content: `Analise estes dados dos últimos ${period_days} dias:\n${JSON.stringify(aggregate, null, 2)}\n\nGere insights via tool call.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_insights",
            description: "Emite insights estruturados",
            parameters: {
              type: "object",
              properties: {
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      insight_type: { type: "string", enum: ["pattern", "recommendation", "alert"] },
                      title: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string", enum: ["info", "warning", "critical", "success"] },
                    },
                    required: ["insight_type", "title", "description", "severity"],
                  },
                },
              },
              required: ["insights"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_insights" } },
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429 || status === 402) {
        return new Response(
          JSON.stringify({ error: status === 429 ? "Rate limit AI" : "AI credits exhausted" }),
          { status, headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ aggregate, insights: [], error: "AI error" }), {
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { insights: [] };
    const insights = args.insights ?? [];

    // Persist (best-effort)
    if (insights.length > 0) {
      const rows = insights.map((i: { insight_type: string; title: string; description: string; severity: string }) => ({
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        insight_type: i.insight_type,
        title: i.title,
        description: i.description,
        severity: i.severity,
        supporting_data: aggregate,
      }));
      await bestEffortWrite(supabase.from("win_loss_insights").insert(rows), "win_loss_insights insert error:");
    }

    return new Response(JSON.stringify({ aggregate, insights }), {
      headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("win-loss-analyzer error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
