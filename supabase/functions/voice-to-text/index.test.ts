import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

Deno.test("voice-to-text: rejects unauthenticated requests", async () => {
  const res = await fetch(`${BASE_URL}/voice-to-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ audio: "test" }),
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("voice-to-text: handles OPTIONS preflight", async () => {
  const res = await fetch(`${BASE_URL}/voice-to-text`, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });

  // Should return 200 or 204 with CORS headers
  assertEquals(res.status <= 204, true);
  await res.text(); // consume body
});
