import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20, message: "Rate limit excedido para conversational-search." });

const InputSchema = z.object({
  query: z.string().min(3).max(500),
});

const SYSTEM_PROMPT = `Você é um interpretador de buscas em linguagem natural para um CRM brasileiro.
Converta a pergunta do usuário em filtros estruturados chamando UMA das ferramentas disponíveis.

REGRAS:
- Sempre escolha a ferramenta mais específica para a entidade perguntada (contatos, empresas, deals, interações).
- Use português ao preencher campos textuais (cidade, stage, tag).
- Para "não falo há X dias/semanas/meses", calcule dias_sem_interacao (semanas*7, meses*30).
- Para valores monetários: "50k"=50000, "100 mil"=100000, "1 milhão"=1000000.
- Stages de deals: lead, qualified, proposal, negotiation, won, lost.
- Se não conseguir interpretar, escolha a ferramenta mais próxima com filtros mínimos.
- Sempre retorne um summary curto explicando o filtro aplicado.`;

const tools = [
  {
    type: "function",
    function: {
      name: "search_contacts_filtered",
      description: "Buscar contatos com filtros estruturados.",
      parameters: {
        type: "object",
        properties: {
          cidade: { type: "string", description: "Cidade do contato (via empresa)" },
          estado: { type: "string", description: "UF do estado" },
          dias_sem_interacao: { type: "number", description: "Contatos sem interação há N dias" },
          tag: { type: "string", description: "Tag específica" },
          relationship_stage: { type: "string", description: "Estágio do relacionamento" },
          min_score: { type: "number", description: "Score mínimo de relacionamento" },
          summary: { type: "string", description: "Resumo curto do filtro em PT-BR" },
        },
        required: ["summary"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_companies_filtered",
      description: "Buscar empresas com filtros estruturados.",
      parameters: {
        type: "object",
        properties: {
          cidade: { type: "string" },
          estado: { type: "string" },
          industry: { type: "string", description: "Setor/indústria" },
          is_customer: { type: "boolean" },
          tag: { type: "string" },
          summary: { type: "string" },
        },
        required: ["summary"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_deals_filtered",
      description: "Buscar deals/oportunidades com filtros estruturados.",
      parameters: {
        type: "object",
        properties: {
          stage: { type: "string", enum: ["lead", "qualified", "proposal", "negotiation", "won", "lost"] },
          valor_min: { type: "number", description: "Valor mínimo em reais" },
          valor_max: { type: "number" },
          dias_max_idade: { type: "number", description: "Deals criados nos últimos N dias" },
          summary: { type: "string" },
        },
        required: ["summary"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_interactions_filtered",
      description: "Buscar interações com filtros estruturados.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["email", "call", "meeting", "whatsapp", "note"] },
          sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
          dias_recentes: { type: "number", description: "Interações dos últimos N dias" },
          summary: { type: "string" },
        },
        required: ["summary"],
        additionalProperties: false,
      },
    },
  },
];

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

interface ToolCallResult {
  entity: "contacts" | "companies" | "deals" | "interactions";
  filters: Record<string, unknown>;
  summary: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const raw = await req.json();
    const parsed = InputSchema.safeParse(raw);
    if (!parsed.success) {
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }
    const query = parsed.data.query.trim();
    const queryHash = await sha256(query.toLowerCase());

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Cache lookup
    const { data: cached } = await supabase
      .from("conversational_search_cache")
      .select("response, expires_at")
      .eq("user_id", userId)
      .eq("query_hash", queryHash)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return jsonOk({ ...cached.response, cached: true }, req);
    }

    // 2) Call Lovable AI gateway with tool calling
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: query },
        ],
        tools,
        tool_choice: "required",
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return jsonError("Rate limit IA excedido. Tente novamente.", 429, req);
      if (aiResponse.status === 402) return jsonError("Créditos IA insuficientes.", 402, req);
      const txt = await aiResponse.text();
      console.error("AI error:", aiResponse.status, txt);
      return jsonError("Erro ao interpretar pergunta", 500, req);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return jsonOk({
        intent: null,
        results: [],
        summary: "Não consegui interpretar sua pergunta. Tente reformular.",
        cached: false,
      }, req);
    }

    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(toolCall.function.arguments || "{}");
    } catch {
      args = {};
    }

    const entityMap: Record<string, ToolCallResult["entity"]> = {
      search_contacts_filtered: "contacts",
      search_companies_filtered: "companies",
      search_deals_filtered: "deals",
      search_interactions_filtered: "interactions",
    };
    const entity = entityMap[toolCall.function.name];
    if (!entity) {
      return jsonError("Ferramenta IA inválida", 500, req);
    }

    const summary = String(args.summary || "Filtro aplicado");
    delete args.summary;

    const responsePayload = {
      intent: toolCall.function.name,
      entity,
      filters: args,
      summary,
      cached: false,
    };

    // 3) Persist cache (upsert)
    await supabase
      .from("conversational_search_cache")
      .upsert({
        user_id: userId,
        query_hash: queryHash,
        query_text: query,
        response: responsePayload,
        model: "google/gemini-2.5-flash",
        expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      }, { onConflict: "user_id,query_hash" });

    return jsonOk(responsePayload, req);
  } catch (error) {
    console.error("conversational-search error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500, req);
  }
});
