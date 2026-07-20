import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Muitas análises. Aguarde antes de tentar novamente." });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;
  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth as string;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  try {
    const { room_id } = await req.json();
    if (!room_id) return jsonError("room_id required", 400, req);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: room } = await supabase.from("deal_rooms").select("*").eq("id", room_id).maybeSingle();
    if (!room || room.user_id !== userId) return jsonError("Not found", 404, req);

    const [{ data: ms }, { data: sh }] = await Promise.all([
      supabase.from("deal_room_milestones").select("*").eq("room_id", room_id),
      supabase.from("deal_room_stakeholders").select("*").eq("room_id", room_id),
    ]);

    const milestones = ms ?? [];
    const stakeholders = sh ?? [];
    const total = milestones.length || 1;
    const done = milestones.filter((m: { status: string }) => m.status === "done").length;
    const overdue = milestones.filter((m: { status: string; due_date?: string | null }) => m.due_date && m.status !== "done" && new Date(m.due_date) < new Date()).length;
    const buyerEng = stakeholders.filter((s: { side: string; engagement_score?: number | null }) => s.side === "buyer").reduce((a: number, s: { side: string; engagement_score?: number | null }) => a + (s.engagement_score || 0), 0) /
      Math.max(1, stakeholders.filter((s: { side: string }) => s.side === "buyer").length);
    const lastView = room.last_buyer_view_at ? (Date.now() - new Date(room.last_buyer_view_at).getTime()) / 86400000 : 999;

    const baseHealth = Math.round(
      (done / total) * 40 +
      (1 - overdue / total) * 25 +
      (buyerEng / 100) * 20 +
      (lastView < 7 ? 15 : lastView < 14 ? 8 : 0)
    );

    let recommendations: string[] = [];
    try {
      const aiResp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Você é um coach de vendas B2B. Em PT-BR, gere exatamente 3 recomendações curtas e acionáveis." },
            { role: "user", content: JSON.stringify({ room_title: room.title, total_ms: total, done, overdue, buyer_engagement: Math.round(buyerEng), days_since_buyer_view: Math.round(lastView), health: baseHealth }) },
          ],
          tools: [{
            type: "function",
            function: {
              name: "submit_recommendations",
              description: "Submit 3 recommendations",
              parameters: {
                type: "object",
                properties: { recommendations: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } },
                required: ["recommendations"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "submit_recommendations" } },
        }),
      });
      if (aiResp.ok) {
        const j = await aiResp.json();
        const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (args) recommendations = JSON.parse(args).recommendations || [];
      }
    } catch (e) {
      console.error("AI error", e);
    }

    await supabase.from("deal_rooms").update({
      health_score: baseHealth,
      health_recommendations: recommendations,
      health_analyzed_at: new Date().toISOString(),
    }).eq("id", room_id);

    return jsonOk({ health_score: baseHealth, recommendations }, req);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "error", 500, req);
  }
});
