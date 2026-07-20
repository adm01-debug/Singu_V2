import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE_URL = `${SUPABASE_URL}/functions/v1`;

Deno.test("voice-agent: rejects unauthenticated requests", async () => {
  const res = await fetch(`${BASE_URL}/voice-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ text: "buscar contatos", userId: "test" }),
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("voice-agent: handles OPTIONS preflight", async () => {
  const res = await fetch(`${BASE_URL}/voice-agent`, {
    method: "OPTIONS",
    headers: { apikey: SUPABASE_ANON_KEY },
  });

  assertEquals(res.status <= 204, true);
  await res.text();
});

Deno.test("voice-agent: rejects non-POST methods", async () => {
  const res = await fetch(`${BASE_URL}/voice-agent`, {
    method: "GET",
    headers: { apikey: SUPABASE_ANON_KEY },
  });

  assertEquals(res.status >= 400, true);
  await res.text();
});
