import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "44444444-4444-4444-8444-444444444444";
const ownedId = "22222222-2222-4222-8222-222222222222";
const foreignId = "33333333-3333-4333-8333-333333333333";

Deno.test("não testa conexões alheias, não grava sem dono e registra erros com o usuário autenticado", async () => {
  const reads: string[] = [];
  const writes: Array<{ path: string; query: string; body: Record<string, unknown>; authorization: string | null }> = [];
  let outsideRequests = 0;
  let rejectAudit = false;
  const fakeApi = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, async (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/auth/v1/user") {
      const id = request.headers.get("Authorization") === "Bearer sessao-outro" ? otherUserId : userId;
      return Response.json({ id, aud: "authenticated", role: "authenticated" });
    }
    if (url.pathname === "/rest/v1/connection_configs" && request.method === "GET") {
      reads.push(url.search);
      const found = url.searchParams.get("created_by") === `eq.${userId}`
        && url.searchParams.get("id") === `eq.${ownedId}`;
      return Response.json(found ? [{ id: ownedId }] : []);
    }
    if (url.pathname.startsWith("/rest/v1/") && ["PATCH", "POST"].includes(request.method)) {
      const body = await request.json();
      await new Promise((resolve) => setTimeout(resolve, 25));
      writes.push({ path: url.pathname, query: url.search, body, authorization: request.headers.get("Authorization") });
      if (rejectAudit && url.pathname.endsWith("connection_test_logs")) {
        return Response.json({ code: "PGRST", message: "auditoria indisponível" }, { status: 503 });
      }
      return new Response(null, { status: 204 });
    }
    outsideRequests++;
    return new Response("Destino externo não deve ser acessado", { status: 500 });
  });
  const child = new Deno.Command(Deno.execPath(), {
    args: ["run", "--node-modules-dir=none", "--allow-net", "--allow-env", "supabase/functions/connection-tester/index.ts"],
    env: {
      HOME: Deno.env.get("HOME")!,
      SUPABASE_URL: `http://127.0.0.1:${fakeApi.addr.port}`,
      SUPABASE_ANON_KEY: "anon-teste",
    },
    clearEnv: true,
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        const response = await fetch("http://127.0.0.1:8000/", { method: "OPTIONS" });
        ready = response.ok;
        if (ready) break;
      } catch { /* Inicialização do subprocesso. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(ready, "Handler não iniciou");

    const submit = (connectionId?: string, token = "sessao-teste") =>
      fetch("http://127.0.0.1:8000/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ connection_type: "custom", connection_id: connectionId, config: { url: `http://127.0.0.1:${fakeApi.addr.port}/outside` } }),
      });

    assertEquals((await submit(ownedId, "")).status, 401);
    assertEquals(reads.length, 0);
    assertEquals((await submit(foreignId)).status, 404);
    assertEquals((await submit(ownedId, "sessao-outro")).status, 404);
    assertEquals(writes.length, 0);
    assertEquals(outsideRequests, 0);

    const ownerResponse = await submit(ownedId);
    assertEquals(ownerResponse.status, 200);
    const ownerBody = await ownerResponse.json();
    assertEquals(ownerBody.success, false);
    assert(ownerBody.error.includes("Destino de URL bloqueado"));
    assertEquals(reads.length, 3);
    assertEquals(writes.length, 2);
    assert(writes.some((write) => write.path.endsWith("connection_test_logs") && write.body.tested_by === userId));
    assert(writes.some((write) => write.path.endsWith("connection_configs") && write.body.last_test_status === "error" && write.query.includes(`created_by=eq.${userId}`)));
    assert(writes.every((write) => write.authorization === "Bearer sessao-teste"));
    assertEquals(outsideRequests, 0);

    const insecureResponse = await fetch("http://127.0.0.1:8000/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer sessao-teste" },
      body: JSON.stringify({
        connection_type: "supabase_external",
        connection_id: ownedId,
        config: { url: `http://127.0.0.1:${fakeApi.addr.port}/outside`, anon_key: "chave-teste" },
      }),
    });
    assertEquals(insecureResponse.status, 200);
    const insecureBody = await insecureResponse.json();
    assertEquals(insecureBody.success, false);
    assert(insecureBody.error.includes("HTTPS"));
    assertEquals(outsideRequests, 0);
    assertEquals(writes.length, 4);

    rejectAudit = true;
    const response = await submit(ownedId);
    assertEquals(response.status, 200);
    assertEquals((await response.json()).success, false);
    assertEquals(writes.length, 6);
    assertEquals(outsideRequests, 0);
  } finally {
    child.kill("SIGTERM");
    await child.output();
    await fakeApi.shutdown();
  }
});
