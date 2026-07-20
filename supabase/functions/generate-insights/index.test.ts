import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

Deno.test("generate-insights: rejects unauthenticated requests", async () => {
  const res = await fetch(`${BASE_URL}/generate-insights`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ contacts: [], interactions: [] }),
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("generate-insights: handles OPTIONS preflight", async () => {
  const res = await fetch(`${BASE_URL}/generate-insights`, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });

  assertEquals(res.status <= 204, true);
  await res.text();
});

Deno.test("generate-insights: rejects GET method", async () => {
  const res = await fetch(`${BASE_URL}/generate-insights`, {
    method: "GET",
    headers: { apikey: SUPABASE_ANON_KEY },
  });

  // Should reject with 405 or similar
  assertEquals(res.status >= 400, true);
  await res.text();
});
