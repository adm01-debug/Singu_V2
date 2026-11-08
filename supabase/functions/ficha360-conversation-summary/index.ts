import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

const InteractionItemSchema = z.object({
  id: z.string().uuid(),
  channel: z.string().nullable().optional(),
  direction: z.string().nullable().optional(),
  data_interacao: z.string().nullable().optional(),
  assunto: z.string().nullable().optional(),
  resumo: z.string().nullable().optional(),
});

const BodySchema = z.object({
  contact_id: z.string().uuid(),
  interactions: z.array(InteractionItemSchema).min(0).max(200),
  contact_snapshot: z.object({
    full_name: z.string(),
    role_title: z.string().nullable().optional(),
    company_name: z.string().nullable().optional(),
    disc_profile: z.string().nullable().optional(),
    hobbies: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }),
  filters_summary: z.object({
    period_days: z.number().optional(),
    channels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    query: z.string().optional(),
  }).default({}),
  force_refresh: z.boolean().optional().default(false),
});

const SUMMARY_TOOL = {
  type: "function",
  function: {
    name: "registrar_resumo_conversa",
    description: "Estrutura o resumo executivo da conversa e perfil da pessoa em PT-BR.",
    parameters: {
      type: "object",
      properties: {
        perfil_resumido: { type: "string" },
        estilo_comunicacao: { type: "string" },
        topicos_principais: { type: "array", items: { type: "string" } },
        decisoes_acordos: { type: "array", items: { type: "string" } },
        pendencias: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string" },
              prazo_estimado: { type: "string" },
            },
            required: ["item"],
            additionalProperties: false,
          },
        },
        sinais_relacionamento: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tipo: { type: "string", enum: ["positivo", "atencao", "negativo"] },
              descricao: { type: "string" },
            },
            required: ["tipo", "descricao"],
            additionalProperties: false,
          },
        },
        proximos_passos_sugeridos: { type: "array", items: { type: "string" } },
        risco_churn: { type: "string", enum: ["baixo", "medio", "alto"] },
        confianca_analise: { type: "number" },
      },
      required: [
        "perfil_resumido",
        "estilo_comunicacao",
        "topicos_principais",
        "decisoes_acordos",
        "pendencias",
        "sinais_relacionamento",
        "proximos_passos_sugeridos",
        "risco_churn",
        "confianca_analise",
      ],
      additionalProperties: false,
    },
  },
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;
  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;
  const limited = limiter.check(userId, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 256 * 1024);
  if (bodyError) return bodyError;

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return jsonError("Payload inválido: " + JSON.stringify(parsed.error.flatten().fieldErrors), 400, req);
  }
  const { contact_id, interactions, contact_snapshot, filters_summary, force_refresh } = parsed.data;

  if (interactions.length === 0) {
    return jsonError("Sem interações para resumir.", 400, req);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const sortedIds = [...interactions.map((i) => i.id)].sort();
  const filtersHashInput = JSON.stringify({ filters_summary, ids: sortedIds });
  const filters_hash = await sha256Hex(filtersHashInput);

  // Cache lookup: 24h
  if (!force_refresh) {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: cached } = await supabase
      .from("ficha360_conversation_summaries")
      .select("summary, model, created_at, interactions_analyzed")
      .eq("user_id", userId)
      .eq("contact_id", contact_id)
      .eq("filters_hash", filters_hash)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached) {
      return jsonOk({
        summary: cached.summary,
        model: cached.model,
        generated_at: cached.created_at,
        interactions_analyzed: cached.interactions_analyzed,
        from_cache: true,
      }, req);
    }
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return jsonError("IA indisponível (LOVABLE_API_KEY ausente).", 503, req);

  // Trunca conteúdo por interação
  const trimmed = interactions.slice(0, 200).map((i) => ({
    id: i.id,
    canal: i.channel ?? "—",
    direcao: i.direction ?? "—",
    quando: i.data_interacao ?? null,
    assunto: (i.assunto ?? "").slice(0, 200),
    resumo: (i.resumo ?? "").slice(0, 600),
  }));

  const systemPrompt = `Você é um analista sênior de relacionamento e vendas. Gere um resumo executivo em PT-BR a partir de interações filtradas com um contato. Seja específico, factual e conciso. Use APENAS a tool registrar_resumo_conversa para responder.`;

  const userPrompt = `Contato: ${JSON.stringify(contact_snapshot)}
Filtros aplicados: ${JSON.stringify(filters_summary)}
Total de interações analisadas: ${trimmed.length}

Interações (mais recentes primeiro):
${JSON.stringify(trimmed, null, 0)}

Gere o resumo estruturado.`;

  let aiResp: Response;
  try {
    aiResp = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [SUMMARY_TOOL],
        tool_choice: { type: "function", function: { name: "registrar_resumo_conversa" } },
      }),
    });
  } catch (e) {
    console.error("AI gateway fetch failed:", e);
    return jsonError("Falha ao contactar a IA. Tente novamente.", 502, req);
  }

  if (aiResp.status === 429) {
    return jsonError("Limite de uso da IA atingido. Aguarde alguns instantes.", 429, req);
  }
  if (aiResp.status === 402) {
    return jsonError("Créditos da IA esgotados. Adicione créditos no workspace para continuar.", 402, req);
  }
  if (!aiResp.ok) {
    const txt = await aiResp.text().catch(() => "");
    console.error("AI gateway error:", aiResp.status, txt);
    return jsonError("Erro da IA ao gerar resumo.", 500, req);
  }

  const aiJson = await aiResp.json();
  const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    return jsonError("Resposta da IA sem estrutura esperada.", 500, req);
  }

  let summary: Record<string, unknown>;
  try {
    summary = JSON.parse(toolCall.function.arguments);
  } catch {
    return jsonError("Não foi possível interpretar a resposta da IA.", 500, req);
  }

  const model = "google/gemini-3-flash-preview";
  const generated_at = new Date().toISOString();

  // Persiste cache + histórico (best-effort)
  await bestEffortWrite(supabase
    .from("ficha360_conversation_summaries")
    .insert({
      user_id: userId,
      contact_id,
      filters_hash,
      interaction_ids: sortedIds,
      filters_summary,
      summary,
      model,
      interactions_analyzed: trimmed.length,
    }), "Failed to cache summary:");

  return jsonOk({
    summary,
    model,
    generated_at,
    interactions_analyzed: trimmed.length,
    from_cache: false,
  }, req);
});
