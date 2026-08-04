/**
 * Tests for timingSafeStringEqual (crypto.subtle HMAC-based implementation).
 *
 * Run with:
 *   deno test supabase/functions/_shared/auth_test.ts
 */
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { timingSafeStringEqual } from "./auth.ts";

// ─── Correctness tests ────────────────────────────────────────────────────────

Deno.test("timingSafeStringEqual: identical ASCII strings → true", async () => {
  assertEquals(await timingSafeStringEqual("hello", "hello"), true);
});

Deno.test("timingSafeStringEqual: different strings same byte-length → false", async () => {
  // "aaa" and "aab" share byte-length but differ in content
  assertEquals(await timingSafeStringEqual("aaa", "aab"), false);
});

Deno.test("timingSafeStringEqual: different strings different length → false", async () => {
  assertEquals(await timingSafeStringEqual("secret", "secret!"), false);
});

Deno.test("timingSafeStringEqual: both empty strings → true", async () => {
  assertEquals(await timingSafeStringEqual("", ""), true);
});

Deno.test("timingSafeStringEqual: one empty one non-empty → false", async () => {
  assertEquals(await timingSafeStringEqual("", "x"), false);
  assertEquals(await timingSafeStringEqual("x", ""), false);
});

Deno.test("timingSafeStringEqual: identical multi-byte Unicode strings → true", async () => {
  // Each emoji is 4 UTF-8 bytes
  const s = "🔐🔑✅";
  assertEquals(await timingSafeStringEqual(s, s), true);
});

Deno.test("timingSafeStringEqual: different multi-byte Unicode strings → false", async () => {
  // Different emoji, same UTF-8 byte length (4 bytes each × 3)
  assertEquals(await timingSafeStringEqual("🔐🔑✅", "🔓🔒❌"), false);
});

Deno.test("timingSafeStringEqual: string with trailing null bytes vs shorter string → false", async () => {
  // "\x00" is the NUL byte; "a\x00" must not equal "a"
  assertEquals(await timingSafeStringEqual("a\x00", "a"), false);
  assertEquals(await timingSafeStringEqual("a", "a\x00"), false);
});

Deno.test("timingSafeStringEqual: long realistic secret strings match → true", async () => {
  // eslint-disable-next-line sonarjs/no-hardcoded-secrets -- test fixture, not a real secret
  const secret = "sk_live_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH";
  const matchResult = await timingSafeStringEqual(secret, secret);
  assertEquals(matchResult, true);
  assertEquals(await timingSafeStringEqual(secret, secret), true);
});

Deno.test("timingSafeStringEqual: long realistic secret strings differ by one byte → false", async () => {
  const a = "sk_live_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH";
  const b = "sk_live_abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGi"; // last char differs
  assertEquals(await timingSafeStringEqual(a, b), false);
});

Deno.test("timingSafeStringEqual: comparison is case-sensitive → false", async () => {
  assertEquals(await timingSafeStringEqual("Secret", "secret"), false);
  assertEquals(await timingSafeStringEqual("SECRET", "secret"), false);
});

Deno.test("timingSafeStringEqual: whitespace matters → false", async () => {
  assertEquals(await timingSafeStringEqual("secret ", "secret"), false);
  assertEquals(await timingSafeStringEqual(" secret", "secret"), false);
});

// ─── Idempotency / determinism ─────────────────────────────────────────────────

Deno.test("timingSafeStringEqual: multiple calls with same inputs are consistent", async () => {
  const a = "my-webhook-secret";
  const b = "my-webhook-secret";
  const results = await Promise.all(
    Array.from({ length: 10 }, () => timingSafeStringEqual(a, b)),
  );
  assertEquals(results.every((r) => r === true), true);
});

Deno.test("timingSafeStringEqual: multiple calls with different inputs are consistently false", async () => {
  const a = "my-webhook-secret";
  const b = "wrong-secret";
  const results = await Promise.all(
    Array.from({ length: 10 }, () => timingSafeStringEqual(a, b)),
  );
  assertEquals(results.every((r) => r === false), true);
});

// ─── Length-leak guard ─────────────────────────────────────────────────────────

Deno.test("timingSafeStringEqual: empty string vs single NUL byte → false", async () => {
  // Ensures padding zero-bytes in the longer buffer do not cause a match
  // when the shorter string is itself all zero-bytes.
  assertEquals(await timingSafeStringEqual("", "\x00"), false);
  assertEquals(await timingSafeStringEqual("\x00", ""), false);
});

Deno.test("timingSafeStringEqual: two NUL strings of different length → false", async () => {
  assertEquals(await timingSafeStringEqual("\x00", "\x00\x00"), false);
});
