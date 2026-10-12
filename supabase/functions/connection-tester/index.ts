
import { createClient } from "npm:@supabase/supabase-js@2";
import type { Database } from "../../../src/integrations/supabase/types.ts";
import {
  scopedCorsHeaders,
  handleCorsAndMethod,
  withAuth,
  guardBody,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";
import { safeFetch } from "../_shared/safe-http.ts";
import { bestEffortWrite } from "../_shared/best-effort-write.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

interface TestResult {
  latency_ms: number;
  message: string;
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
}

async function testSupabase(config: Record<string, unknown>): Promise<TestResult> {
  const url = trimTrailingSlashes(String(config.url ?? ""));
  const key = String(config.anon_key ?? config.service_role_key ?? "");
  if (!url || !key) throw new Error("URL e chave (anon ou service role) obrigatórias");
  if (new URL(url).protocol !== "https:") throw new Error("URL do Supabase deve usar HTTPS");
  const t0 = Date.now();
  const res = await safeFetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: "Supabase respondeu OK" };
}

async function testBitrix(config: Record<string, unknown>): Promise<TestResult> {
  const webhook = trimTrailingSlashes(String(config.webhook_url ?? ""));
  if (!webhook) throw new Error("webhook_url obrigatório");
  const t0 = Date.now();
  const res = await safeFetch(`${webhook}/profile.json`);
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: "Bitrix24 respondeu OK" };
}

async function testN8n(config: Record<string, unknown>): Promise<TestResult> {
  const webhook = String(config.webhook_url ?? "");
  if (!webhook) throw new Error("webhook_url obrigatório");
  const t0 = Date.now();
  const res = await safeFetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ping: true, source: "singu", ts: Date.now() }),
  });
  const ms = Date.now() - t0;
  if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: `n8n respondeu HTTP ${res.status}` };
}

async function testMcpClaude(config: Record<string, unknown>): Promise<TestResult> {
  const url = String(config.server_url ?? "");
  if (!url) throw new Error("server_url obrigatório");
  const t0 = Date.now();
  const res = await safeFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "singu", version: "1.0" },
      },
    }),
  });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: "Servidor MCP respondeu" };
}

async function testCustom(config: Record<string, unknown>): Promise<TestResult> {
  const url = String(config.url ?? "");
  if (!url) throw new Error("url obrigatória");
  const method = String(config.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "POST"].includes(method)) {
    throw new Error(`Método HTTP não permitido: ${method}`);
  }
  const t0 = Date.now();
  const res = await safeFetch(url, { method });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { latency_ms: ms, message: `Teste HTTP OK — ${res.status}` };
}

interface TestPayload extends Record<string, unknown> {
  connection_id?: string;
  connection_type: "supabase_external" | "bitrix24" | "n8n" | "mcp_claude" | "custom";
  config: Record<string, unknown>;
}

async function recordTest(
  client: ReturnType<typeof createClient<Database>>,
  connectionId: string,
  userId: string,
  status: "success" | "error",
  message: string,
  latencyMs: number | null = null,
) {
  const signal = AbortSignal.timeout(5_000);
  const logWrite = Promise.resolve().then(() => createClient<Database>(
    Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ).from("connection_test_logs").insert({
    connection_id: connectionId,
    status,
    latency_ms: latencyMs,
    message,
    tested_by: userId,
  }).abortSignal(signal));
  await Promise.all([
    bestEffortWrite(client.from("connection_configs").update({
      last_tested_at: new Date().toISOString(),
      last_test_status: status,
      last_test_latency_ms: latencyMs,
      last_test_message: message,
    }).eq("id", connectionId).eq("created_by", userId).abortSignal(signal), "Falha ao atualizar o teste da conexão:"),
    bestEffortWrite(logWrite, "Falha ao registrar o teste da conexão:"),
  ]);
}

Deno.serve(async (req) => {
  const earlyResponse = handleCorsAndMethod(req);
  if (earlyResponse) return earlyResponse;

  const corsH = scopedCorsHeaders(req);

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  let userId: string | null = null;
  let client: ReturnType<typeof createClient<Database>> | undefined;
  let ownedConnectionId: string | undefined;

  try {
    const authResult = await withAuth(req);
    if (authResult instanceof Response) return authResult;

    userId = authResult;

    const rl = limiter.check(userId, req);
    if (rl) return rl;

    const vct = validate(rawBody, {
      connection_type: { type: 'string', required: true, maxLength: 30 },
      connection_id:   { type: 'string', maxLength: 36 },
      config:          { type: 'object', required: true },
    });
    if (!vct.ok) {
      return new Response(JSON.stringify({ success: false, error: vct.error }), {
        status: 400,
        headers: { ...corsH, 'Content-Type': 'application/json' },
      });
    }
    const payload = vct.data as TestPayload;
    if (payload.connection_id) {
      client = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await client.from("connection_configs").select("id")
        .eq("id", payload.connection_id).eq("created_by", userId).abortSignal(AbortSignal.timeout(5_000)).maybeSingle();
      if (error) throw new Error("Não foi possível verificar o proprietário da conexão");
      if (!data) return new Response(JSON.stringify({ success: false, error: "Conexão não encontrada" }), {
        status: 404,
        headers: { ...corsH, "Content-Type": "application/json" },
      });
      ownedConnectionId = payload.connection_id;
    }
    let result: TestResult;

    switch (payload.connection_type) {
      case "supabase_external": result = await testSupabase(payload.config);  break;
      case "bitrix24":          result = await testBitrix(payload.config);    break;
      case "n8n":               result = await testN8n(payload.config);       break;
      case "mcp_claude":        result = await testMcpClaude(payload.config); break;
      case "custom":            result = await testCustom(payload.config);    break;
      default: throw new Error("Tipo de conexão desconhecido");
    }

    if (client && ownedConnectionId) await recordTest(client, ownedConnectionId, userId, "success", result.message, result.latency_ms);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsH, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    if (client && ownedConnectionId && userId) await recordTest(client, ownedConnectionId, userId, "error", message);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 200,
      headers: { ...corsH, "Content-Type": "application/json" },
    });
  }
});
