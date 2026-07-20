import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/lead-routing`;

/* ─── Helper ─── */
async function callFunction(body: Record<string, unknown>, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

/* ═══════════════════════════════════════════════════════════
   1. SEGURANÇA — Chamadas sem autenticação
   ═══════════════════════════════════════════════════════════ */

Deno.test("SEC-01: distribute sem token retorna 401", async () => {
  const { status, data } = await callFunction({ action: "distribute" });
  assertEquals(status, 401);
  assertEquals(data.error, "Não autorizado");
});

Deno.test("SEC-02: redistribute sem token retorna 401", async () => {
  const { status, data } = await callFunction({ action: "redistribute", inactivity_days: 7 });
  assertEquals(status, 401);
  assertEquals(data.error, "Não autorizado");
});

Deno.test("SEC-03: reset_daily sem token retorna 401", async () => {
  const { status, data } = await callFunction({ action: "reset_daily" });
  assertEquals(status, 401);
  assertEquals(data.error, "Não autorizado");
});

Deno.test("SEC-04: token inválido retorna 401", async () => {
  const { status, data } = await callFunction(
    { action: "distribute" },
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.invalid",
  );
  assertEquals(status, 401);
  assertExists(data.error);
});

/* ═══════════════════════════════════════════════════════════
   2. VALIDAÇÃO — Payloads inválidos (requer auth para chegar ao Zod)
   Estes testes verificam que o 401 bloqueia antes da validação,
   confirmando a camada de segurança como primeira barreira.
   ═══════════════════════════════════════════════════════════ */

Deno.test("VAL-01: action inexistente sem auth retorna 401", async () => {
  const { status } = await callFunction({ action: "hack_system" });
  assertEquals(status, 401);
});

Deno.test("VAL-02: role_filter inválido sem auth retorna 401", async () => {
  const { status } = await callFunction({ action: "distribute", role_filter: "hacker" });
  assertEquals(status, 401);
});

Deno.test("VAL-03: inactivity_days negativo sem auth retorna 401", async () => {
  const { status } = await callFunction({ action: "redistribute", inactivity_days: -5 });
  assertEquals(status, 401);
});

Deno.test("VAL-04: body vazio sem auth retorna 401", async () => {
  const { status } = await callFunction({});
  assertEquals(status, 401);
});

/* ═══════════════════════════════════════════════════════════
   3. CORS — Preflight OPTIONS
   ═══════════════════════════════════════════════════════════ */

Deno.test("CORS-01: OPTIONS retorna headers CORS corretos", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  const body = await res.text();

  assertEquals(res.headers.get("access-control-allow-origin"), "*");
  assertExists(res.headers.get("access-control-allow-headers"));
  assertEquals(body, "ok");
});

/* ═══════════════════════════════════════════════════════════
   4. RESPOSTAS — Formato correto do JSON de erro
   ═══════════════════════════════════════════════════════════ */

Deno.test("RESP-01: resposta 401 possui content-type JSON", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action: "distribute" }),
  });
  const ct = res.headers.get("content-type");
  assertExists(ct);
  assertEquals(ct!.includes("application/json"), true);
  await res.text(); // consume body
});

Deno.test("RESP-02: resposta de erro possui campo 'error' no JSON", async () => {
  const { data } = await callFunction({ action: "reset_daily" });
  assertExists(data.error);
  assertEquals(typeof data.error, "string");
});
