import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5, message: "Análise de whitespace muito frequente. Aguarde." });

interface AIOpportunity {
  opportunity_type: "cross_sell" | "up_sell" | "expansion" | "renewal";
  product_category: string;
  estimated_value: number;
  confidence: number;
  rationale: string;
}

async function callLovableAI(account: Record<string, unknown>, committee: unknown[], traceId: string): Promise<AIOpportunity[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const prompt = `Analise a conta ABM e gere 3-5 oportunidades de whitespace (cross-sell, up-sell, expansão, renovação).

Conta:
- Nome: ${account.company_name}
- Tier: ${account.tier}
- Score atual: ${account.account_score}
- Receita-alvo: ${account.target_revenue ?? "não definida"}
- Status: ${account.status}
- Tamanho do comitê de compra: ${committee.length}

Para cada oportunidade, retorne tipo, categoria de produto/serviço, valor estimado em BRL, confiança (0-100) e justificativa em português.`;

  const response = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-trace-id": traceId
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "Você é um analista sênior de Account-Based Marketing especializado em identificar oportunidades de expansão de conta." },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_whitespace_opportunities",
            description: "Submete oportunidades de whitespace identificadas na conta",
            parameters: {
              type: "object",
              properties: {
                opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      opportunity_type: { type: "string", enum: ["cross_sell", "up_sell", "expansion", "renewal"] },
                      product_category: { type: "string" },
                      estimated_value: { type: "number" },
                      confidence: { type: "number" },
                      rationale: { type: "string" },
                    },
                    required: ["opportunity_type", "product_category", "estimated_value", "confidence", "rationale"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["opportunities"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_whitespace_opportunities" } },
    }),
  });

  if (response.status === 429) throw new Error("ai_gateway_rate_limited");
  if (response.status === 402) throw new Error("insufficient_credits");
  if (!response.ok) throw new Error(`Lovable AI error: ${response.status}`);

  const data = await response.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return [];

  const args = JSON.parse(toolCall.function.arguments);
  return Array.isArray(args.opportunities) ? args.opportunities : [];
}

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "abm-whitespace-analyzer");

  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const authResult = await withAuth(req);
  if (typeof authResult !== "string") return authResult;
  const userId = authResult;

  const limited = limiter.check(userId, req);
  if (limited) {
    log.warn("rate_limit_exceeded", { userId });
    return limited;
  }

  const { body: rawBody, error: bodyError } = await guardBody(req, 128 * 1024);
  if (bodyError) return bodyError;

  try {
    const { account_id } = rawBody as { account_id: string };
    if (!account_id) return jsonError("account_id is required", 400, req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    log.info("analysis_started", { accountId: account_id, userId });

    const { data: account, error: accErr } = await supabase
      .from("abm_accounts")
      .select("*")
      .eq("id", account_id)
      .eq("user_id", userId)
      .single();
    
    if (accErr || !account) {
      log.warn("account_not_found", { accountId: account_id });
      return jsonError("Conta não encontrada", 404, req);
    }

    const { data: committee } = await supabase
      .from("abm_buying_committee")
      .select("*")
      .eq("account_id", account_id);

    const opportunities = await callLovableAI(account, committee ?? [], traceId);

    const inserts = opportunities.map((opp) => ({
      account_id,
      user_id: userId,
      opportunity_type: opp.opportunity_type,
      product_category: opp.product_category,
      estimated_value: opp.estimated_value,
      confidence: Math.min(100, Math.max(0, Math.round(opp.confidence))),
      rationale: opp.rationale,
      status: "identified",
    }));

    if (inserts.length === 0) {
      log.info("no_opportunities_identified");
      return jsonOk({ generated: 0, opportunities: [], traceId }, req);
    }

    const { data: created, error: insErr } = await supabase
      .from("abm_whitespace_opportunities")
      .insert(inserts)
      .select();
    
    if (insErr) {
      log.error("insert_opportunities_failed", { error: insErr.message });
      return jsonError(insErr.message, 500, req);
    }

    log.info("analysis_complete", { count: created?.length });
    return jsonOk({ generated: created?.length ?? 0, opportunities: created ?? [], traceId }, req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    log.error("fatal_error", { error: msg });
    return jsonError(msg, 500, req);
  }
});
