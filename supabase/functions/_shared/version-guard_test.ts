/**
 * Teste unitário do helper `assertVersionMatch`.
 *
 * Garante o contrato do guard de optimistic locking:
 * - Versão bateu (>=1 linha): retorna `null` → handler segue fluxo normal
 * - Conflito (0 linhas): retorna `Response` 409 com payload JSON estruturado
 * - Defensivo (não-array): retorna 409 ao invés de crashar
 *
 * Roda offline (sem rede). Executável via `supabase--test_edge_functions`.
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { assertVersionMatch } from "./version-guard.ts";

const FAKE_REQ = new Request("https://example.com/fn", { method: "POST" });
const OPTS = {
  entity: "contacts",
  id: "abc-123",
  attemptedVersion: 7,
  req: FAKE_REQ,
  traceId: "trace-xyz",
};

Deno.test("version-guard: versão bateu (1+ linhas) → retorna null", () => {
  const result = assertVersionMatch([{ id: "abc-123", version: 8 }], OPTS);
  assertEquals(result, null, "Deve retornar null quando UPDATE afetou >=1 linha");
});

Deno.test("version-guard: conflito (0 linhas) → retorna Response 409 com JSON estruturado", async () => {
  const result = assertVersionMatch([], OPTS);
  assert(result instanceof Response, "Deve retornar Response");
  assertEquals(result.status, 409, "Status deve ser 409");
  const body = await result.json();
  assertEquals(body.error, "CONCURRENT_EDIT");
  assertEquals(body.entity, "contacts");
  assertEquals(body.id, "abc-123");
  assertEquals(body.attemptedVersion, 7);
  assertEquals(body.traceId, "trace-xyz");
});

Deno.test("version-guard: defensivo — null não crasha, retorna 409", async () => {
  const result = assertVersionMatch(null as unknown as unknown[], OPTS);
  assert(result instanceof Response);
  assertEquals(result.status, 409);
  const body = await result.json();
  assertEquals(body.error, "CONCURRENT_EDIT");
});

Deno.test("version-guard: defensivo — undefined retorna 409", async () => {
  const result = assertVersionMatch(undefined as unknown as unknown[], OPTS);
  assert(result instanceof Response);
  assertEquals(result.status, 409);
  await result.text();
});

Deno.test("version-guard: traceId opcional não quebra payload", async () => {
  const optsNoTrace = { ...OPTS, traceId: undefined };
  const result = assertVersionMatch([], optsNoTrace);
  assert(result instanceof Response);
  const body = await result.json();
  assertEquals(body.error, "CONCURRENT_EDIT");
  assertEquals(body.traceId, undefined);
});
