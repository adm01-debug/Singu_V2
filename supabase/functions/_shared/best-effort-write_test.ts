import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { bestEffortWrite } from "./best-effort-write.ts";

Deno.test("grava um builder PostgREST antes de retornar", async () => {
  let attempts = 0;
  const client = createClient("https://example.test", "test-key", {
    global: { fetch: () => {
      attempts++;
      return Promise.resolve(new Response(null, { status: 204 }));
    } },
  });
  await bestEffortWrite(client.from("logs").insert({ status: "success" }), "Falha no log:");
  assertEquals(attempts, 1);
});

Deno.test("falhas do banco e rejeições não alteram o resultado principal", async () => {
  const errors: unknown[][] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => { errors.push(args); };
  try {
    const client = createClient("https://example.test", "test-key", {
      global: { fetch: () => Promise.resolve(new Response(JSON.stringify({ message: "denied", code: "42501" }), { status: 403 })) },
    });
    await bestEffortWrite(client.from("logs").insert({ status: "success" }), "Falha no log:");
    await bestEffortWrite(Promise.reject(new Error("network failure")), "Falha de rede:");
    assertEquals(errors.length, 2);
    assertEquals(errors.map(([label]) => label), ["Falha no log:", "Falha de rede:"]);
  } finally {
    console.error = originalError;
  }
});
