import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 30, message: "Rate limit exceeded for insights. Please wait." });

const InsightsInput = z.object({
  contacts: z.array(z.record(z.unknown())).optional().default([]),
  interactions: z.array(z.record(z.unknown())).optional().default([]),
  companies: z.array(z.record(z.unknown())).optional().default([]),
});

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "generate-insights");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // ── Rate limit ──
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  // 🔒 Authenticate — userId from JWT
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      log.error("lovable_key_missing");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const rawBody = await req.json();
    const parsed = InsightsInput.safeParse(rawBody);
    if (!parsed.success) {
      log.warn("invalid_input", { errors: parsed.error.flatten().fieldErrors });
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }
    const { contacts, interactions, companies } = parsed.data;

    log.info("generation_started", { contacts: contacts.length, interactions: interactions.length, companies: companies.length });

    const systemPrompt = `Você é um assistente especializado em análise de relacionamentos comerciais e CRM. Sua função é analisar dados de contatos, empresas e interações para gerar insights acionáveis.

Analise os dados fornecidos e gere insights nas seguintes categorias:
1. RELACIONAMENTO: Avalie a saúde dos relacionamentos, identifique contatos que precisam de atenção
2. SENTIMENTO: Analise o sentimento das interações e identifique tendências
3. AÇÃO: Sugira ações específicas para melhorar relacionamentos
4. OPORTUNIDADE: Identifique oportunidades de negócio ou networking
5. RISCO: Identifique riscos de perda de relacionamento ou cliente

Para cada insight, forneça:
- Título claro e objetivo
- Descrição detalhada
- Sugestão de ação específica
- Nível de confiança (0-100)
- Se é acionável (true/false)

Responda APENAS com um JSON válido no formato especificado.`;

    const userPrompt = `Analise os seguintes dados e gere insights:

CONTATOS (${contacts?.length || 0}):
${JSON.stringify(contacts?.slice(0, 20) || [], null, 2)}

INTERAÇÕES RECENTES (${interactions?.length || 0}):
${JSON.stringify(interactions?.slice(0, 30) || [], null, 2)}

EMPRESAS (${companies?.length || 0}):
${JSON.stringify(companies?.slice(0, 10) || [], null, 2)}

Gere entre 3 e 8 insights relevantes baseados nestes dados. Retorne um JSON com a seguinte estrutura:
{
  "insights": [
    {
      "category": "relationship|sentiment|action|opportunity|risk",
      "title": "Título do insight",
      "description": "Descrição detalhada",
      "action_suggestion": "Sugestão de ação específica",
      "confidence": 85,
      "actionable": true,
      "contact_id": "uuid do contato relacionado (opcional)",
      "priority": "high|medium|low"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        log.warn("ai_gateway_rate_limited");
        return jsonError("Limite de requisições excedido. Tente novamente em alguns minutos.", 429, req);
      }
      if (response.status === 402) {
        log.warn("insufficient_credits");
        return jsonError("Créditos insuficientes. Adicione créditos em Configurações > Workspace > Uso.", 402, req);
      }
      const errorText = await response.text();
      log.error("ai_gateway_failed", { status: response.status, error: errorText });
      return jsonError("Erro ao gerar insights", 500, req);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    let insights = [];
    try {
      // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insights = parsed.insights || [];
      }
    } catch (parseError) {
      log.error("json_parse_failed", { error: parseError.message, content });
    }

    log.info("generation_complete", { count: insights.length });
    return jsonOk({ insights, traceId }, req);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    log.error("fatal_error", { error: msg });
    return jsonError(msg, 500, req);
  }
});
