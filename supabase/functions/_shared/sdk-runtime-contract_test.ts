import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { logAiGatewayCall, withAiGatewayMetrics } from "./aiGatewayLogger.ts";
import { withHandler } from "./edge-test-harness.ts";

async function withLogger(check: (rows: Array<Record<string, unknown>>) => Promise<void>, status = 201) {
  const rows: Array<Record<string, unknown>> = [];
  const previous = [Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")];
  const api = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, async req => {
    assertEquals(req.method, "POST");
    assertEquals(new URL(req.url).pathname, "/rest/v1/ai_gateway_metrics");
    assertEquals(req.headers.get("apikey"), "logger-teste");
    rows.push(await req.json());
    return status < 400 ? new Response(null, { status }) : Response.json({ message: "Recusa simulada" }, { status });
  });
  Deno.env.set("SUPABASE_URL", `http://127.0.0.1:${api.addr.port}`);
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "logger-teste");
  try { await check(rows); }
  finally {
    for (const [i, key] of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].entries()) {
      const value = previous[i];
      if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value);
    }
    await api.shutdown();
  }
}

Deno.test("logger com SDK exato executa insert e preserva normalização de métricas", async () => {
  await withLogger(async rows => {
    await logAiGatewayCall({ functionName: "teste-local", status: "success", durationMs: 12.7,
      model: "modelo-simulado", tokensIn: 10, tokensOut: 5, httpStatus: 200, errorMessage: "x".repeat(600) });
    assertEquals(rows, [{ function_name: "teste-local", status: "success", duration_ms: 13,
      model: "modelo-simulado", tokens_in: 10, tokens_out: 5, http_status: 200,
      error_code: null, error_message: "x".repeat(500), user_id: null }]);
  });
});

Deno.test("logger mantém best-effort em erro HTTP e rejeição de transporte", async () => {
  await withLogger(async rows => {
    await logAiGatewayCall({ functionName: "teste-local", status: "error", durationMs: -2 });
    assertEquals(rows.length, 1);
    assertEquals(rows[0].duration_ms, 0);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error("Rede simulada indisponível"));
    try { await logAiGatewayCall({ functionName: "teste-local", status: "error", durationMs: 1 }); }
    finally { globalThis.fetch = originalFetch; }
    assertEquals(rows.length, 1);
  }, 503);
});

Deno.test("wrapper de métricas preserva resultado, status e identidade do erro original", async () => {
  await withLogger(async rows => {
    const meta = { functionName: "teste-local", model: "modelo-simulado" };
    assertEquals(await withAiGatewayMetrics(meta, () => Promise.resolve({ result: 42, httpStatus: 429 })), 42);
    assertEquals(await withAiGatewayMetrics(meta, () => Promise.resolve({ result: "ok", httpStatus: 200 })), "ok");
    for (const message of ["timeout simulado", "erro simulado"]) {
      const original = new Error(message);
      const caught = await assertRejects(() => withAiGatewayMetrics(meta, () => Promise.reject(original)), Error, message);
      assertEquals(caught === original, true);
    }
    assertEquals(rows.map(row => row.status), ["rate_limited", "success", "timeout", "error"]);
  });
});

Deno.test("logger sem configuração não faz requisição", async () => {
  await withLogger(async rows => {
    Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
    await logAiGatewayCall({ functionName: "teste-local", status: "success", durationMs: 1 });
    assertEquals(rows, []);
  });
});

const auth = { "x-dual-write-secret": "proxy-teste" };
const configured = (base: string) => ({ LEGACY_SUPABASE_URL: base, LEGACY_SERVICE_ROLE_KEY: "legado-teste",
  DUAL_WRITE_SECRET: "proxy-teste", DUAL_WRITE_TABLES: "contacts" });

for (const op of ["insert", "update", "upsert", "delete"] as const) {
  Deno.test(`proxy com SDK exato executa ${op} somente no backend local`, async () => {
    let calls = 0;
    await withHandler("dual-write-proxy", async req => {
      calls++;
      const url = new URL(req.url);
      assertEquals(url.pathname, "/rest/v1/contacts");
      assertEquals(req.headers.get("apikey"), "legado-teste");
      assertEquals(req.method, op === "update" ? "PATCH" : op === "delete" ? "DELETE" : "POST");
      if (op === "update" || op === "delete") assertEquals(url.searchParams.get("id"), "eq.registro-1");
      if (op === "upsert") assertEquals(req.headers.get("prefer")?.includes("resolution=merge-duplicates"), true);
      if (op !== "delete") assertEquals(await req.json(), { first_name: "Maria" });
      return new Response(null, { status: 204 });
    }, async submit => {
      const response = await submit({ table: "contacts", op, row: { first_name: "Maria" }, match: { id: "registro-1" } }, auth);
      assertEquals(response.status, 200);
      assertEquals(await response.json(), { ok: true });
      assertEquals(calls, 1);
    }, false, configured);
  });

  Deno.test(`proxy com SDK exato mantém erro502 em recusa de ${op}`, async () => {
    let calls = 0;
    await withHandler("dual-write-proxy", () => {
      calls++;
      return Response.json({ message: "Recusa simulada", code: "42501" }, { status: 403 });
    }, async submit => {
      const response = await submit({ table: "contacts", op, row: { first_name: "Maria" }, match: { id: "registro-1" } }, auth);
      assertEquals(response.status, 502);
      assertEquals((await response.json()).error, "Falha ao gravar no banco legado");
      assertEquals(calls, 1);
    }, false, configured);
  });
}

Deno.test("proxy mantém segredo, allowlist e exigência de filtro antes de acessar backend", async () => {
  let calls = 0;
  await withHandler("dual-write-proxy", () => { calls++; return new Response(null, { status: 204 }); }, async submit => {
    for (const [body, headers, status] of [
      [{ table: "contacts", op: "insert", row: {} }, {}, 401],
      [{ table: "profiles", op: "insert", row: {} }, auth, 403],
      [{ table: "contacts", op: "delete" }, auth, 400],
      [{ table: "contacts", op: "update", row: {}, match: {} }, auth, 400],
    ] as const) {
      const response = await submit(body, headers);
      assertEquals(response.status, status);
      await response.body?.cancel();
    }
    assertEquals(calls, 0);
  }, false, configured);
});

Deno.test("proxy sem banco legado configurado mantém503 sem acesso externo", async () => {
  await withHandler("dual-write-proxy", () => { throw new Error("Acesso indevido"); }, async submit => {
    const response = await submit({ table: "contacts", op: "insert", row: {} }, auth);
    assertEquals(response.status, 503);
    await response.body?.cancel();
  }, false, () => ({ DUAL_WRITE_SECRET: "proxy-teste" }));
});
