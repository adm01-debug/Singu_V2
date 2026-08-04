/**
 * E2E test for optimistic locking via `update_with_version` action.
 *
 * Cenários:
 *  1. UPDATE com versão correta → 200 OK + version+1
 *  2. UPDATE com versão obsoleta → 409 + error: 'CONCURRENT_EDIT'
 *
 * Pré-requisitos: variáveis VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
 * e um usuário autenticado de teste (via TEST_USER_JWT) — opcional; se ausente
 * o teste valida apenas o contrato de erro 401.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
const TEST_JWT = Deno.env.get("TEST_USER_JWT");

const ENDPOINT = `${SUPABASE_URL}/functions/v1/external-data`;

function headers(jwt?: string) {
  return {
    "Content-Type": "application/json",
    "apikey": ANON_KEY!,
    "Authorization": `Bearer ${jwt ?? ANON_KEY}`,
  };
}

Deno.test("optimistic-locking: requires authentication", async () => {
  if (!SUPABASE_URL || !ANON_KEY) {
    console.log("⏭️  Skipping — SUPABASE_URL/ANON_KEY missing");
    return;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": ANON_KEY },
    body: JSON.stringify({ action: "update_with_version", table: "contacts", id: "x", version: 1, updates: {} }),
  });
  await res.text();
  assert(res.status === 401 || res.status === 403, `Expected 401/403, got ${res.status}`);
});

Deno.test("optimistic-locking: stale version returns 409 CONCURRENT_EDIT", async () => {
  if (!TEST_JWT) {
    console.log("⏭️  Skipping conflict test — TEST_USER_JWT not configured");
    return;
  }

  // 1. Buscar um contato existente para ter um id+version válido
  const listRes = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(TEST_JWT),
    body: JSON.stringify({ action: "select", table: "contacts", filters: {}, limit: 1 }),
  });
  const listJson = await listRes.json();
  const contact = listJson?.data?.[0];
  if (!contact?.id) {
    console.log("⏭️  No contacts available to test against");
    return;
  }
  const id = contact.id;
  const currentVersion = contact.version ?? 0;

  // 2. Update válido (version atual)
  const okRes = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(TEST_JWT),
    body: JSON.stringify({
      action: "update_with_version",
      table: "contacts",
      id,
      version: currentVersion,
      updates: { notes: `lock-test-${Date.now()}` },
    }),
  });
  const okJson = await okRes.json();
  assertEquals(okRes.status, 200, `Expected 200, got ${okRes.status}: ${JSON.stringify(okJson)}`);
  assertEquals(okJson.data.version, currentVersion + 1, "Version should increment by 1");

  // 3. Update inválido (version antiga reutilizada)
  const conflictRes = await fetch(ENDPOINT, {
    method: "POST",
    headers: headers(TEST_JWT),
    body: JSON.stringify({
      action: "update_with_version",
      table: "contacts",
      id,
      version: currentVersion, // OBSOLETA — já incrementou para currentVersion+1
      updates: { notes: `should-fail-${Date.now()}` },
    }),
  });
  const conflictJson = await conflictRes.json();
  assertEquals(conflictRes.status, 409, `Expected 409, got ${conflictRes.status}: ${JSON.stringify(conflictJson)}`);
  assertEquals(conflictJson.error, "CONCURRENT_EDIT", "Error code should be CONCURRENT_EDIT");
});
