/**
 * Edge-case tests for fetchWithTimeout — ensures deadlines abort the request.
 * Uses a local Deno.serve that intentionally stalls.
 * Run with: deno test --allow-net supabase/functions/_shared/fetch-utils_test.ts
 */
import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { fetchWithTimeout, OPENROUTER_CHAT_URL, applyOpenRouterAuth, routeToOpenRouter } from "./fetch-utils.ts";

Deno.test("fetchWithTimeout: aborts with TimeoutError when deadline elapses", async () => {
  const ac = new AbortController();
  const server = Deno.serve(
    { port: 0, signal: ac.signal, onListen: () => {} },
    () => new Promise<Response>(() => {}),
  );
  const addr = server.addr as Deno.NetAddr;
  const url = `http://127.0.0.1:${addr.port}/stall`;

  await assertRejects(() => fetchWithTimeout(url, {}, 50), Error);

  ac.abort();
  await server.finished.catch(() => {});
});

Deno.test("fetchWithTimeout: succeeds when server responds under deadline", async () => {
  const ac = new AbortController();
  const server = Deno.serve(
    { port: 0, signal: ac.signal, onListen: () => {} },
    () => new Response("ok"),
  );
  const addr = server.addr as Deno.NetAddr;
  const res = await fetchWithTimeout(`http://127.0.0.1:${addr.port}/`, {}, 2000);
  const body = await res.text();
  assert(body === "ok");
  ac.abort();
  await server.finished.catch(() => {});
});

Deno.test("roteamento de IA: o endereco antigo do gateway vai para o OpenRouter", () => {
  const body = JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [] });
  const [url, init] = routeToOpenRouter("https://ai.gateway.lovable.dev/v1/chat/completions", { body });
  assertEquals(url, OPENROUTER_CHAT_URL);
  assertEquals(JSON.parse(init.body as string).model, "google/gemini-2.5-flash");
});

Deno.test("roteamento de IA: host divergente e demais campos do corpo sao preservados", () => {
  const body = JSON.stringify({ model: "x", messages: [{ role: "user", content: "oi" }], tool_choice: "auto" });
  const [url, init] = routeToOpenRouter("https://api.lovable.dev/v1/chat/completions", { body, method: "POST" });
  assertEquals(url, OPENROUTER_CHAT_URL);
  assertEquals(init.method, "POST");
  const parsed = JSON.parse(init.body as string);
  assertEquals(parsed.messages.length, 1);
  assertEquals(parsed.tool_choice, "auto");
});

Deno.test("roteamento de IA: URL que nao e do gateway passa intacta", () => {
  const opts = { method: "POST", body: "{}" };
  const [url, init] = routeToOpenRouter("https://api.elevenlabs.io/v1/text-to-speech/x", opts);
  assertEquals(url, "https://api.elevenlabs.io/v1/text-to-speech/x");
  assertEquals(init, opts);
});

Deno.test("chave de IA: o Bearer legado e trocado pela chave do OpenRouter", () => {
  const opts = {
    method: "POST",
    headers: { Authorization: "Bearer chave-legada", "Content-Type": "application/json" },
    body: "{}",
  };
  const out = applyOpenRouterAuth(opts, "sk-or-nova");
  const headers = new Headers(out.headers as HeadersInit);
  assertEquals(headers.get("authorization"), "Bearer sk-or-nova");
  assertEquals(headers.get("content-type"), "application/json");
});

Deno.test("chave de IA: Headers instanciado tambem e reescrito", () => {
  const headers = new Headers([["authorization", "Bearer legado"]]);
  const out = applyOpenRouterAuth({ headers }, "sk-or-nova");
  assertEquals(new Headers(out.headers as HeadersInit).get("authorization"), "Bearer sk-or-nova");
});

Deno.test("chave de IA: sem chave configurada nada e alterado", () => {
  const opts = { headers: { Authorization: "Bearer legado" } };
  assertEquals(applyOpenRouterAuth(opts, undefined), opts);
});

Deno.test("chave de IA: chamada sem Authorization nao ganha chave", () => {
  const opts = { headers: { "Content-Type": "application/json" } };
  assertEquals(applyOpenRouterAuth(opts, "sk-or-nova"), opts);
});
