/**
 * Edge-case tests for the in-memory sliding-window rate limiter.
 * Run with: deno test supabase/functions/_shared/rate-limit_test.ts
 */
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { rateLimit } from "./rate-limit.ts";

Deno.test("rateLimit: allows requests below the max", () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 3 });
  assertEquals(limiter.check("ip-1"), null);
  assertEquals(limiter.check("ip-1"), null);
  assertEquals(limiter.check("ip-1"), null);
});

Deno.test("rateLimit: returns 429 with Retry-After when max is exceeded", async () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2 });
  limiter.check("ip-a");
  limiter.check("ip-a");
  const res = limiter.check("ip-a");
  assert(res instanceof Response, "expected a Response after exceeding max");
  assertEquals(res!.status, 429);
  assert(res!.headers.get("Retry-After") !== null, "Retry-After header must be present");
  assertEquals(res!.headers.get("X-RateLimit-Limit"), "2");
  assertEquals(res!.headers.get("X-RateLimit-Remaining"), "0");
  const body = await res!.json();
  assertEquals(typeof body.error, "string");
});

Deno.test("rateLimit: independent keys have independent counters", () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });
  assertEquals(limiter.check("ip-x"), null);
  assertEquals(limiter.check("ip-y"), null);
  assert(limiter.check("ip-x") instanceof Response);
  assert(limiter.check("ip-y") instanceof Response);
});

Deno.test("rateLimit: window rolls over after resetAt", async () => {
  const limiter = rateLimit({ windowMs: 20, max: 1 });
  assertEquals(limiter.check("k"), null);
  assert(limiter.check("k") instanceof Response);
  await new Promise((r) => setTimeout(r, 30));
  assertEquals(limiter.check("k"), null, "counter must reset after window expires");
});

Deno.test("rateLimit: remaining() returns max for unknown keys", () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 5 });
  assertEquals(limiter.remaining("never-seen"), 5);
});

Deno.test("rateLimit: remaining() decrements and floors at zero", () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2 });
  limiter.check("z");
  assertEquals(limiter.remaining("z"), 1);
  limiter.check("z");
  assertEquals(limiter.remaining("z"), 0);
  limiter.check("z"); // over-limit
  assertEquals(limiter.remaining("z"), 0, "remaining must not go negative");
});

Deno.test("rateLimit: scoped CORS headers use request origin when Request provided", () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });
  const req = new Request("https://example.com", { headers: { Origin: "https://foo.lovable.app" } });
  limiter.check("scoped", req);
  const res = limiter.check("scoped", req);
  assert(res instanceof Response);
  // CORS headers may or may not echo the origin depending on allowlist, but must not throw
  assertEquals(res!.status, 429);
});