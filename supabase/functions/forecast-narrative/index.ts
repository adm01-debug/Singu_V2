import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuth, jsonError, jsonOk, scopedCorsHeaders } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: scopedCorsHeaders(req) });
  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  try {
    const { period_id } = await req.json();
    if (!period_id) return jsonError("period_id required", 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: period } = await admin.from("forecast_periods").select("*").eq("id", period_id).eq("user_id", userId).maybeSingle();
    if (!period) return jsonError("Período não encontrado", 404);
    const { data: forecasts } = await admin.from("deal_forecasts").select("*").eq("period_id", period_id).order("forecasted_amount", { ascending: false }).limit(50);

    const commit = (forecasts ?? []).filter(f => f.category === "commit").reduce((s, f) => s + Number(f.forecasted_amount), 0);
    const bestCase = (forecasts ?? []).filter(f => f.category === "best_case").reduce((s, f) => s + Number(f.forecasted_amount), 0);
    const atRisk = (forecasts ?? []).filter(f => f.health_score < 40).slice(0, 10);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY not configured", 500);

    const prompt = `Gere uma narrativa executiva (2-3 parágrafos curtos) sobre o forecast atual:

Período: ${period.period_type} ${period.period_start} → ${period.period_end}
Quota: R$ ${Number(period.quota_amount).toLocaleString("pt-BR")}
Commit: R$ ${commit.toLocaleString("pt-BR")}
Best case: R$ ${bestCase.toLocaleString("pt-BR")}
Attainment commit/quota: ${period.quota_amount > 0 ? Math.round((commit / Number(period.quota_amount)) * 100) : 0}%
Total deals: ${forecasts?.length ?? 0}
Deals em risco (health<40): ${atRisk.length}

Top deals em risco: ${JSON.stringify(atRisk.map(d => ({ name: d.deal_name, amount: d.forecasted_amount, risks: d.risk_factors })))}

Inclua: status vs quota, principais riscos, recomendações de ação. Tom executivo, direto, em português.`;

    const aiResp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um VP de vendas analisando forecast. Responda em português, tom executivo." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return jsonError("Rate limit", 429);
      if (aiResp.status === 402) return jsonError("Créditos esgotados", 402);
      throw new Error(`AI ${aiResp.status}`);
    }
    const result = await aiResp.json();
    const narrative = result.choices?.[0]?.message?.content ?? "";

    return jsonOk({ narrative, commit, best_case: bestCase, quota: Number(period.quota_amount), at_risk_count: atRisk.length });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "error", 500);
  }
});
