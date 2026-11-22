import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
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
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  // 🔒 Authenticate — userId from JWT
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!LOVABLE_API_KEY) {
      log.error("lovable_key_missing");
      throw new Error("DEEPSEEK_API_KEY is not configured");
    }

    const { body: rawBody, error: bodyError } = await guardBody(req, 512 * 1024); // 512 KB — arrays of CRM records
    if (bodyError) return bodyError;

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

    const response = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insights = parsed.insights || [];
      }
    } catch (parseError) {
      log.error("json_parse_failed", { error: parseError instanceof Error ? parseError.message : String(parseError), content });
    }

    log.info("generation_complete", { count: insights.length });

    // ── Persistência dos insights gerados ──
    // Categorias da IA (relationship|sentiment|action|opportunity|risk) não
    // correspondem ao CHECK da tabela (opportunity|risk|pattern|suggestion):
    // normaliza para o enum do banco preservando o valor original na UI.
    const CATEGORY_MAP: Record<string, string> = {
      relationship: "pattern",
      sentiment: "pattern",
      action: "suggestion",
    };
    // Categorias válidas no CHECK da tabela — um valor fora disso derruba o
    // insert inteiro (constraint), então filtra antes de persistir.
    const VALID_CATEGORIES = new Set(["opportunity", "risk", "pattern", "suggestion"]);
    const latest = new Date().toISOString();
    const rows = insights
      .filter((i: { contact_id?: string; category?: string }) =>
        typeof i.contact_id === "string" &&
        VALID_CATEGORIES.has(CATEGORY_MAP[i.category ?? ""] ?? i.category ?? ""))
      .map((i: { category: string; title: string; description?: string; action_suggestion?: string; confidence?: number; actionable?: boolean; contact_id: string }) => ({
        user_id: userId,
        contact_id: i.contact_id,
        title: i.title,
        description: i.description ?? null,
        category: CATEGORY_MAP[i.category] ?? i.category,
        confidence: Number.isFinite(i.confidence) ? i.confidence : null,
        actionable: i.actionable ?? false,
        action_suggestion: i.action_suggestion ?? null,
        source: "generate-insights",
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: latest,
      }));
    // persisted reflete o que o banco REALMENTE gravou, nao o que foi tentado:
    // com bestEffortWrite o insert pode falhar (FK de contact_id, CHECK de
    // categoria) e a resposta ainda diria persisted>0. Aqui o erro e capturado
    // e a contagem so avanca quando o insert passa.
    let persisted = 0;
    let persistError: string | null = null;
    if (rows.length > 0) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      // bestEffortWrite: falha de persistência não derruba a resposta (a IA já
      // retornou). Duplicata de re-geração é evitada pela UI (limite de recentes).
      const write = await supabase.from("insights").insert(rows);
      if (write.error) {
        persistError = write.error.message ?? String(write.error);
        console.error("generate-insights persist error:", write.error);
      } else {
        persisted = rows.length;
      }
    }

    return jsonOk({ insights, traceId, persisted, ...(persistError ? { persistError } : {}) }, req);
  } catch (error) {
    log.error("fatal_error", { error: error instanceof Error ? error.message : String(error) });
    return jsonError("Internal server error", 500, req);
  }
});
