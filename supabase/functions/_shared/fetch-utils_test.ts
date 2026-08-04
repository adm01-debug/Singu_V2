/**
 * Edge-case tests for fetchWithTimeout — ensures deadlines abort the request.
 * Uses a local Deno.serve that intentionally stalls.
 * Run with: deno test --allow-net supabase/functions/_shared/fetch-utils_test.ts
 */
import { assert, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { fetchWithTimeout } from "./fetch-utils.ts";

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