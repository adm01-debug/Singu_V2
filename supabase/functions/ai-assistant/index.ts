import {
  handleCorsAndMethod,
  withAuth,
  jsonError,
  jsonOk,
  guardBody,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { z } from "npm:zod@3.23.8";
import { createClient } from "npm:@supabase/supabase-js@2";

const limiter = rateLimit({ windowMs: 60_000, max: 30, message: "Rate limit exceeded for assistant." });

const InputSchema = z.object({
  thread_id: z.string().uuid(),
  message: z.string().min(1).max(4000),
  context_entity_type: z.string().optional(),
  context_entity_id: z.string().uuid().optional(),
});

const SYSTEM_PROMPT = `Você é o assistente IA do SINGU CRM, especializado em ajudar vendedores e gestores comerciais.

CAPACIDADES:
- Responder perguntas sobre contatos, empresas, oportunidades e interações
- Sugerir próximos passos comerciais
- Analisar relacionamentos e identificar riscos
- Ajudar a redigir mensagens, e-mails e propostas
- Explicar funcionalidades do sistema

REGRAS:
- Responda SEMPRE em português brasileiro
- Seja conciso e objetivo (max 3 parágrafos)
- Use formatação markdown (negrito, listas) quando útil
- Se não souber, diga claramente — nunca invente dados
- Se o contexto incluir uma entidade (contato/empresa), use-a para personalizar a resposta
- Sugira ações concretas sempre que possível`;

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "ai-assistant");

  const guard = handleCorsAndMethod(req);
  if (guard) return guard;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) {
    log.warn("rate_limit_exceeded", { ip });
    return limited;
  }

  const authResult = await withAuth(req);
  if (typeof authResult !== "string") return authResult;
  const userId = authResult;

  const { body: rawBody, error: bodyError } = await guardBody(req, 256 * 1024);
  if (bodyError) return bodyError;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      log.error("lovable_key_missing");
      return jsonError("LOVABLE_API_KEY not configured", 500, req);
    }

    const parsed = InputSchema.safeParse(rawBody);
    if (!parsed.success) {
      log.warn("invalid_input", { errors: parsed.error.flatten().fieldErrors });
      return jsonError(`Invalid input: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }
    const { thread_id, message, context_entity_type, context_entity_id } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    log.info("chat_started", { userId, threadId: thread_id });

    // Verify thread ownership
    const { data: thread, error: threadErr } = await supabase
      .from("ai_chat_threads")
      .select("id, user_id, title")
      .eq("id", thread_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (threadErr || !thread) {
      log.warn("thread_not_found", { threadId: thread_id });
      return jsonError("Thread not found or access denied", 404, req);
    }

    // Save user message
    const { error: msgInsertErr } = await supabase.from("ai_chat_messages").insert({
      thread_id,
      user_id: userId,
      role: "user",
      content: message,
    });
    if (msgInsertErr) console.warn("Failed to persist user message:", msgInsertErr.message);

    // History and entity context are independent — fetch in parallel
    const entityQuery =
      context_entity_type === "contact" && context_entity_id
        ? supabase
            .from("contacts")
            .select("first_name, last_name, email, phone, role_title, sentiment, relationship_score, notes, company:companies(name, industry)")
            .eq("id", context_entity_id)
            .eq("user_id", userId)
            .maybeSingle()
        : context_entity_type === "company" && context_entity_id
          ? supabase
              .from("companies")
              .select("name, industry, city, state, employee_count, annual_revenue, notes, challenges")
              .eq("id", context_entity_id)
              .eq("user_id", userId)
              .maybeSingle()
          : Promise.resolve({ data: null });

    const [{ data: history }, { data: entityData }] = await Promise.all([
      supabase
        .from("ai_chat_messages")
        .select("role, content")
        .eq("thread_id", thread_id)
        .order("created_at", { ascending: true })
        .limit(20),
      entityQuery,
    ]);

    let contextBlock = "";
    if (entityData) {
      const label = context_entity_type === "contact" ? "Contato" : "Empresa";
      contextBlock = `\n\nCONTEXTO — ${label} em foco:\n${JSON.stringify(entityData, null, 2)}`;
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextBlock },
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
    ];

    const aiResponse = await fetchAI("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
        "x-trace-id": traceId
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        log.warn("ai_gateway_rate_limited");
        return jsonError("Limite de requisições atingido. Aguarde alguns minutos.", 429, req);
      }
      if (aiResponse.status === 402) {
        log.warn("insufficient_credits");
        return jsonError("Créditos esgotados. Adicione créditos em Configurações.", 402, req);
      }
      const errText = await aiResponse.text();
      log.error("ai_gateway_failed", { status: aiResponse.status, error: errText });
      return jsonError("Falha ao gerar resposta", 500, req);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";
    const tokens = aiData.usage?.total_tokens || null;

    // Save assistant message
    const { data: savedMsg } = await supabase
      .from("ai_chat_messages")
      .insert({
        thread_id,
        user_id: userId,
        role: "assistant",
        content: reply,
        tokens_used: tokens,
      })
      .select()
      .single();

    // Update thread timestamp + auto-title (fire-and-forget — not used in response)
    const updates: Record<string, unknown> = { last_message_at: new Date().toISOString() };
    if ((history || []).length <= 1 && thread.title === "Nova conversa") {
      updates.title = message.slice(0, 60);
    }
    supabase.from("ai_chat_threads").update(updates).eq("id", thread_id)
      .catch((e: unknown) => console.error("ai_chat_threads update error:", e));

    log.info("chat_complete", { threadId: thread_id, tokens });

    return jsonOk({ message: savedMsg, reply, tokens, traceId }, req);
  } catch (error) {
    log.error("fatal_error", { error: error instanceof Error ? error.message : String(error) });
    return jsonError("Internal server error", 500, req);
  }
});
