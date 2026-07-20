/* eslint-disable sonarjs/no-empty-test-file */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const HEALTH_URL = `${SUPABASE_URL}/functions/v1/health`;

Deno.test("health endpoint returns 200 with status", async () => {
  const res = await fetch(HEALTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });

  const body = await res.json();
  assertEquals(res.status, 200);
  assertExists(body.status);
  assertExists(body.checks);
  assertExists(body.timestamp);
  assertExists(body.version);
  assertEquals(body.version, "1.0.0");
});

Deno.test("health endpoint handles OPTIONS (CORS preflight)", async () => {
  const res = await fetch(HEALTH_URL, { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
  const origin = res.headers.get("Access-Control-Allow-Origin");
  assertEquals(typeof origin, "string");
});

Deno.test("health endpoint includes database check", async () => {
  const res = await fetch(HEALTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });

  const body = await res.json();
  assertExists(body.checks.database);
  assertExists(body.checks.runtime);
  assertExists(body.totalLatencyMs);
});
