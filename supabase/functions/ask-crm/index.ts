import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20, message: "Rate limit exceeded for ask-crm." });

const InputSchema = z.object({
  question: z.string().min(3).max(500),
});

const CONNECTION_TABLES = [
  "connection_configs", "connection_test_logs", "incoming_webhooks",
  "incoming_webhook_logs", "connection_quotas", "connection_anomalies", "mcp_tool_calls",
];

const SYSTEM_PROMPT = `Você é o assistente inteligente do SINGU CRM. O usuário fará perguntas em linguagem natural sobre dados do CRM e integrações.

TABELAS DE CRM (filtrar SEMPRE por user_id = '{USER_ID}'):
- contacts, companies, interactions, deals, tasks (campos típicos de CRM B2B).

TABELAS DE INTEGRAÇÕES (admin — NÃO filtrar por user_id):
- connection_configs(name, connection_type, is_active, last_test_status, last_test_latency_ms, last_tested_at)
- connection_test_logs(connection_id, status, latency_ms, message, created_at)
- incoming_webhooks(name, target_entity, is_active, total_calls, total_errors, last_called_at)
- incoming_webhook_logs(webhook_id, status, http_status, latency_ms, error_message, created_at)
- connection_quotas(webhook_id, calls_used, calls_limit, period_start)
- connection_anomalies(webhook_id, anomaly_type, severity, explanation, detected_at, acknowledged_at)
- mcp_tool_calls(tool_name, status, latency_ms, created_at)

REGRAS:
1. Gere APENAS SELECT — nunca INSERT/UPDATE/DELETE/DDL.
2. CRM: SEMPRE filtre por user_id = '{USER_ID}'.
3. Integrações: NÃO adicione filtro user_id (são globais).
4. Use ILIKE %termo% para buscas textuais.
5. Limite a 20 rows.
6. Datas relativas: NOW() - INTERVAL.
7. Retorne JSON: {"sql":"...", "explanation":"...", "display_type":"table|number|list"}.
   Se não puder responder: {"sql":null, "explanation":"...", "display_type":"text"}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "ask-crm");

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  log.info("request_received", { method: req.method, userId });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const rawBody = await req.json();
    const parsed = InputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }

    const { question } = parsed.data;
    const prompt = SYSTEM_PROMPT.replace("{USER_ID}", userId);

    // Step 1: Generate SQL from question
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: question },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return jsonError("Limite de requisições excedido.", 429, req);
      if (aiResponse.status === 402) return jsonError("Créditos insuficientes.", 402, req);
      log.error("AI gateway error", { status: aiResponse.status });
      return jsonError("Erro ao processar pergunta", 500, req);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed_ai: { sql: string | null; explanation: string; display_type: string };
    try {
      // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      parsed_ai = JSON.parse(jsonMatch[0]);
    } catch {
      return jsonOk({ answer: content, data: null, display_type: "text", sql: null }, req);
    }

    if (!parsed_ai.sql) {
      return jsonOk({ answer: parsed_ai.explanation, data: null, display_type: "text", sql: null }, req);
    }

    // Security: validate SQL is SELECT-only (defence-in-depth; DB function also validates)
    const sql = parsed_ai.sql.trim();
    const sqlUpper = sql.toUpperCase();

    // Block excessively long queries — prevents deeply nested subquery DoS against the planner
    if (sql.length > 2000) {
      return jsonError("Consulta muito complexa. Tente uma pergunta mais simples.", 400, req);
    }

    // Block semicolons — multi-statement injection
    if (sql.includes(";")) {
      return jsonError("Consulta inválida: múltiplos statements não são permitidos.", 403, req);
    }

    // Block SQL comments — prevents keyword/predicate bypass via -- or /* */
    if (/--/.test(sql) || /\/\*/.test(sql)) {
      return jsonError("Consulta inválida: comentários SQL não são permitidos.", 403, req);
    }

    // Must start with SELECT
    const forbidden = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY|CALL|DO|VACUUM|ANALYZE|CLUSTER|LISTEN|NOTIFY|RECURSIVE)\b/i;
    if (!sqlUpper.startsWith("SELECT") || forbidden.test(sql)) {
      return jsonError("Consulta não permitida. Apenas leituras são aceitas.", 403, req);
    }

    // Block access to system schemas
    if (/\b(auth\.|pg_|information_schema|supabase_)/i.test(sql)) {
      return jsonError("Acesso a schemas do sistema não é permitido.", 403, req);
    }

    // Tabelas de integrações são globais (admin) — não exigem filtro user_id
    const sqlLower = parsed_ai.sql.toLowerCase();
    const isAdminQuery = CONNECTION_TABLES.some(t => sqlLower.includes(t));

    // Require userId to appear as an actual WHERE/AND predicate (not just in a comment/literal)
    if (!isAdminQuery) {
      const userIdEscaped = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const userIdInPredicate = new RegExp(
        `(?:where|and|on)\\s+(?:[\\w.]+\\.)?user_id\\s*=\\s*'${userIdEscaped}'`,
        "i",
      );
      if (!userIdInPredicate.test(parsed_ai.sql)) {
        return jsonError("Consulta deve filtrar por usuário autenticado.", 403, req);
      }
    }

    // Se for query admin, valida papel
    if (isAdminQuery) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: roleRow } = await supabaseAuth
        .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!roleRow) return jsonError("Apenas administradores podem consultar dados de integrações.", 403, req);
    }

    // Step 2: Execute the query
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("execute_readonly_query", {
      query_text: parsed_ai.sql,
    });

    if (error) {
      log.error("Query execution failed", { error: error.message, sql: parsed_ai.sql });
      return jsonOk({
        answer: parsed_ai.explanation,
        data: null,
        display_type: "text",
        sql: parsed_ai.sql,
        error: "Não foi possível executar a consulta. Tente reformular.",
      }, req);
    }

    return jsonOk({
      answer: parsed_ai.explanation,
      data,
      display_type: parsed_ai.display_type,
      sql: parsed_ai.sql,
    }, req);
  } catch (error) {
    log.error("ask-crm uncaught error", { error: error instanceof Error ? error.message : String(error) });
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500, req);
  }
});
