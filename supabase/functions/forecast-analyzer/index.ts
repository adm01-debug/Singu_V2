import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuth, jsonError, jsonOk, scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

interface DealInput {
  deal_id: string;
  deal_name?: string;
  contact_id?: string;
  company_id?: string;
  amount: number;
  expected_close_date?: string;
  stage?: string;
  last_activity_at?: string;
  contact_score?: number;
}

function calcHealthScore(d: DealInput, weights: { activity: number; stage_age: number; engagement: number; relationship: number }, inactivityDays: number): { score: number; risks: string[] } {
  const risks: string[] = [];
  let activityScore = 100;
  if (d.last_activity_at) {
    const days = (Date.now() - new Date(d.last_activity_at).getTime()) / 86400_000;
    if (days > inactivityDays * 2) { activityScore = 10; risks.push(`Sem atividade há ${Math.floor(days)} dias`); }
    else if (days > inactivityDays) { activityScore = 40; risks.push(`Atividade recente baixa (${Math.floor(days)} dias)`); }
    else if (days > inactivityDays / 2) activityScore = 70;
  } else {
    activityScore = 20; risks.push("Sem registro de atividade");
  }

  let stageScore = 70;
  if (d.expected_close_date) {
    const days = (new Date(d.expected_close_date).getTime() - Date.now()) / 86400_000;
    if (days < 0) { stageScore = 20; risks.push("Data prevista de fechamento já passou"); }
    else if (days < 7) stageScore = 90;
    else if (days < 30) stageScore = 75;
    else if (days > 90) stageScore = 40;
  }

  const engagementScore = d.contact_score ? Math.min(100, d.contact_score) : 50;
  if (engagementScore < 40) risks.push("Engajamento do contato baixo");

  const relationshipScore = d.contact_score ? Math.min(100, d.contact_score * 0.8 + 20) : 50;

  const total = (
    activityScore * weights.activity +
    stageScore * weights.stage_age +
    engagementScore * weights.engagement +
    relationshipScore * weights.relationship
  ) / 100;

  return { score: Math.round(total), risks };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: scopedCorsHeaders(req) });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const { body, error: bodyError } = await guardBody(req, 256 * 1024);
  if (bodyError) return bodyError;

  try {
    const { period_id, deals } = body as { period_id: string; deals: DealInput[] };
    if (!period_id || !Array.isArray(deals)) return jsonError("period_id and deals[] required", 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: settings } = await admin.from("forecast_quota_settings").select("*").eq("user_id", user.id).maybeSingle();
    const weights = {
      activity: settings?.health_weight_activity ?? 30,
      stage_age: settings?.health_weight_stage_age ?? 25,
      engagement: settings?.health_weight_engagement ?? 25,
      relationship: settings?.health_weight_relationship ?? 20,
    };
    const inactivityDays = settings?.inactivity_threshold_days ?? 14;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY not configured", 500);

    const enriched = deals.map(d => {
      const { score, risks } = calcHealthScore(d, weights, inactivityDays);
      return { ...d, health_score: score, computed_risks: risks };
    });

    const aiPrompt = `Você é um analista de forecast de vendas. Para cada deal abaixo, sugira a categoria de forecast (commit/best_case/pipeline/omitted), confidence_score (0-100) e adicione fatores de risco se houver. Considere health_score, valor, data de fechamento e atividade.

Deals: ${JSON.stringify(enriched.slice(0, 30))}

Regras:
- commit: alta certeza de fechar no período (health > 75, atividade recente, decisor engajado)
- best_case: provável mas com riscos (health 50-75)
- pipeline: oportunidade real mas longe (health 30-50)
- omitted: improvável neste período (health < 30 ou data fora do período)`;

    const aiResp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista sênior de forecasting de vendas B2B. Responda em português." },
          { role: "user", content: aiPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_forecast_categorization",
            description: "Categorize each deal for the forecast period",
            parameters: {
              type: "object",
              properties: {
                categorizations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      deal_id: { type: "string" },
                      category: { type: "string", enum: ["commit","best_case","pipeline","omitted"] },
                      confidence_score: { type: "number" },
                      risk_factors: { type: "array", items: { type: "string" } },
                      rationale: { type: "string" },
                    },
                    required: ["deal_id","category","confidence_score","risk_factors","rationale"],
                  },
                },
              },
              required: ["categorizations"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_forecast_categorization" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return jsonError("Rate limit no AI Gateway", 429);
      if (aiResp.status === 402) return jsonError("Créditos AI esgotados", 402);
      throw new Error(`AI Gateway error ${aiResp.status}`);
    }

    const aiResult = await aiResp.json();
    const tool = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const cats = tool ? JSON.parse(tool.function.arguments).categorizations : [];
    const catMap = new Map(cats.map((c: { deal_id: string }) => [c.deal_id, c]));

    const upserts = enriched.map(d => {
      const cat = catMap.get(d.deal_id) as { category?: string; confidence_score?: number; risk_factors?: string[]; rationale?: string } | undefined;
      const allRisks = [...d.computed_risks, ...(cat?.risk_factors ?? [])];
      return {
        user_id: user.id,
        deal_id: d.deal_id,
        deal_name: d.deal_name,
        contact_id: d.contact_id,
        company_id: d.company_id,
        period_id,
        category: cat?.category ?? "pipeline",
        confidence_score: Math.round(cat?.confidence_score ?? 50),
        forecasted_amount: d.amount,
        forecasted_close_date: d.expected_close_date,
        stage: d.stage,
        risk_factors: allRisks,
        health_score: d.health_score,
        last_activity_at: d.last_activity_at,
        ai_rationale: cat?.rationale,
        analyzed_at: new Date().toISOString(),
      };
    });

    const { error: upErr } = await admin.from("deal_forecasts")
      .upsert(upserts, { onConflict: "deal_id,period_id" });
    if (upErr) throw upErr;

    return jsonOk({ analyzed: upserts.length, categorizations: cats });
  } catch (e) {
    console.error("forecast-analyzer error:", e);
    console.error("forecast-analyzer error:", e);
    return jsonError("Internal server error", 500);
  }
});
