/**
 * Edge-case tests for the shared email verifier heuristics.
 * MX checks are network-dependent; we assert only the deterministic branches
 * (malformed / disposable / role / free) and the score/status envelope.
 * Run with: deno test --allow-net supabase/functions/_shared/email-verify_test.ts
 */
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { verifyEmail } from "./email-verify.ts";

Deno.test("verifyEmail: malformed input (no @) → status invalid, score 0", async () => {
  const r = await verifyEmail("not-an-email");
  assertEquals(r.status, "invalid");
  assertEquals(r.score, 0);
  assert(r.reasons.includes("malformed"));
});

Deno.test("verifyEmail: empty local part → malformed", async () => {
  const r = await verifyEmail("@example.com");
  assertEquals(r.status, "invalid");
  assert(r.reasons.includes("malformed"));
});

Deno.test("verifyEmail: disposable domain always invalid", async () => {
  const r = await verifyEmail("test@mailinator.com");
  assertEquals(r.status, "invalid");
  assertEquals(r.disposable, true);
  assert(r.reasons.includes("disposable_domain"));
});

Deno.test("verifyEmail: role prefix detected (admin@)", async () => {
  const r = await verifyEmail("admin@example.com");
  assertEquals(r.role_account, true);
  assert(r.reasons.includes("role_account"));
});

Deno.test("verifyEmail: role prefix detected in composite local (sales.br@)", async () => {
  const r = await verifyEmail("sales.br@example.com");
  assertEquals(r.role_account, true);
});

Deno.test("verifyEmail: free provider flagged (gmail.com)", async () => {
  const r = await verifyEmail("john@gmail.com");
  assertEquals(r.free_provider, true);
  assert(r.reasons.includes("free_provider"));
});

Deno.test("verifyEmail: uppercase and whitespace are normalised", async () => {
  const r = await verifyEmail("  JOHN@GMAIL.COM  ");
  assertEquals(r.free_provider, true);
});

Deno.test("verifyEmail: score stays within [0,100] envelope", async () => {
  const r = await verifyEmail("admin@mailinator.com");
  assert(r.score >= 0 && r.score <= 100, `score ${r.score} out of range`);
});