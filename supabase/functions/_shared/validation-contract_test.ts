import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const ownerId = "11111111-1111-4111-8111-111111111111";
const foreignId = "22222222-2222-4222-8222-222222222222";
const contactId = "33333333-3333-4333-8333-333333333333";

async function startHandler(name: string, handler: (req: Request) => Response | Promise<Response>) {
  const api = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handler);
  const child = new Deno.Command(Deno.execPath(), {
    args: ["run", "--node-modules-dir=none", "--allow-net", "--allow-env", `supabase/functions/${name}/index.ts`],
    env: {
      HOME: Deno.env.get("HOME")!,
      SUPABASE_URL: `http://127.0.0.1:${api.addr.port}`,
      SUPABASE_ANON_KEY: "anon-teste",
      SUPABASE_SERVICE_ROLE_KEY: "servico-teste",
      CRON_SECRET: "cron-teste",
    },
    clearEnv: true,
    stdout: "piped",
    stderr: "piped",
  }).spawn();
  const close = async () => {
    child.kill("SIGTERM");
    await child.output();
    await api.shutdown();
  };
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:8000/", { method: "OPTIONS" });
      if (response.ok) return close;
    } catch { /* Aguarda o handler isolado. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await close();
  throw new Error("Handler não iniciou");
}

Deno.test("validador interno exige proprietário, bloqueia outro contato e aguarda a persistência", async () => {
  const writes: Array<Record<string, unknown>> = [];
  let rejectInsert = false;
  let waitForInsert = false;
  let releaseInsert = () => {};
  let enteredInsert = () => {};
  const insertStarted = new Promise<void>((resolve) => { enteredInsert = resolve; });
  const insertReleased = new Promise<void>((resolve) => { releaseInsert = resolve; });
  const close = await startHandler("phone-validator", async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/auth/v1/user") return Response.json({ id: ownerId });
    if (url.pathname === "/rest/v1/contacts") {
      const owned = url.searchParams.get("id") === `eq.${contactId}`
        && url.searchParams.get("user_id") === `eq.${ownerId}`;
      return Response.json(owned ? [{ id: contactId }] : []);
    }
    if (url.pathname === "/rest/v1/phone_validations") {
      writes.push(await req.json());
      if (waitForInsert) { enteredInsert(); await insertReleased; }
      return rejectInsert
        ? Response.json({ message: "Persistência indisponível" }, { status: 503 })
        : new Response(null, { status: 201 });
    }
    return new Response(null, { status: 404 });
  });
  const submit = (body: Record<string, unknown>, token = "servico-teste") => fetch("http://127.0.0.1:8000/", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ phone: "+5511999999999", ...body }),
  });
  try {
    assertEquals((await submit({ userId: ownerId }, "")).status, 401);
    assertEquals((await submit({ contactId })).status, 400);
    assertEquals((await submit({ userId: foreignId, contactId })).status, 403);
    assertEquals(writes.length, 0);

    waitForInsert = true;
    let completed = false;
    const pending = submit({ userId: ownerId, contactId }).then((response) => { completed = true; return response; });
    await insertStarted;
    assertEquals(completed, false);
    releaseInsert();
    assertEquals((await pending).status, 200);
    assertEquals(writes[0].user_id, ownerId);
    waitForInsert = false;

    assertEquals((await submit({ userId: foreignId, contactId }, "sessao-teste")).status, 200);
    assertEquals(writes[1].user_id, ownerId);
    assertEquals((await submit({ contactId: foreignId }, "sessao-teste")).status, 403);
    assertEquals(writes.length, 2);
    rejectInsert = true;
    assertEquals((await submit({ userId: ownerId, contactId })).status, 503);
  } finally {
    releaseInsert();
    await close();
  }
});

Deno.test("worker usa o token reservado, conta uma tentativa e não confirma gravações rejeitadas", async () => {
  const itemId = "44444444-4444-4444-8444-444444444444";
  const claimToken = "55555555-5555-4555-8555-555555555555";
  let attempts = 1;
  let rejectValidation = false;
  let rejectUpdate = false;
  let stale = false;
  const updates: Array<Record<string, unknown>> = [];
  const close = await startHandler("validation-queue-worker", async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/rest/v1/rpc/claim_validation_batch") {
      assertEquals(await req.json(), { p_batch_size: 10, p_max_attempts: 3 });
      return Response.json([{ id: itemId, user_id: ownerId, contact_id: contactId, kind: "phone", value: "+5511999999999", attempts, claim_token: claimToken }]);
    }
    if (url.pathname === "/functions/v1/phone-validator") {
      assertEquals(req.headers.get("Authorization"), "Bearer servico-teste");
      assertEquals(await req.json(), { phone: "+5511999999999", contactId, userId: ownerId, persist: true });
      return Response.json({}, { status: rejectValidation ? 503 : 200 });
    }
    if (url.pathname === "/rest/v1/validation_queue") {
      assertEquals(req.method, "PATCH");
      assertEquals(url.searchParams.get("id"), `eq.${itemId}`);
      assertEquals(url.searchParams.get("claim_token"), `eq.${claimToken}`);
      assertEquals(url.searchParams.get("status"), "eq.processing");
      updates.push(await req.json());
      return rejectUpdate
        ? Response.json({ message: "Atualização indisponível" }, { status: 503 })
        : Response.json(stale ? [] : [{ id: itemId }]);
    }
    return new Response(null, { status: 404 });
  });
  const run = () => fetch("http://127.0.0.1:8000/", { method: "POST", headers: { "x-cron-secret": "cron-teste" } });
  try {
    assertEquals(await (await run()).json(), { processed: 1, ok: 1, errors: 0 });
    assertEquals(updates[0].attempts, 1);
    assertEquals(updates[0].claim_token, null);
    assertEquals(updates[0].lease_expires_at, null);
    rejectValidation = true;
    assertEquals(await (await run()).json(), { processed: 1, ok: 0, errors: 1 });
    assertEquals(updates[1].status, "pending");
    attempts = 3;
    await run();
    assertEquals(updates[2].status, "error");
    assert(updates[2].processed_at);
    stale = true;
    assertEquals(await (await run()).json(), { processed: 0, ok: 0, errors: 0 });
    rejectUpdate = true;
    assertEquals((await run()).status, 500);
  } finally {
    await close();
  }
});

Deno.test("worker de perfis encerra conflito atual e preserva reserva substituída", async () => {
  const claimToken = "55555555-5555-4555-8555-555555555555";
  let stale = false;
  let retries = 0;
  const close = await startHandler("process-behavioral-regen-queue", async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/rest/v1/rpc/claim_regen_batch") {
      return Response.json([{ contact_id: contactId, user_id: ownerId, attempts: 1, claim_token: claimToken }]);
    }
    if (url.pathname === "/functions/v1/generate-behavioral-profile") {
      assertEquals(await req.json(), { contact_id: contactId, user_id: ownerId, claim_token: claimToken });
      return Response.json({ error: "Perfil superado" }, { status: 409 });
    }
    if (url.pathname === "/rest/v1/behavioral_profile_regen_queue") {
      assertEquals(url.searchParams.get("claim_token"), `eq.${claimToken}`);
      if (req.method === "PATCH") retries++;
      else assertEquals(req.method, "DELETE");
      return Response.json(stale ? [] : [{ contact_id: contactId }]);
    }
    return new Response(null, { status: 404 });
  });
  const run = () => fetch("http://127.0.0.1:8000/", { method: "POST", headers: { "x-cron-secret": "cron-teste" } });
  try {
    assertEquals(await (await run()).json(), { processed: 1, results: [{ contact_id: contactId, ok: false, superseded: true }] });
    stale = true;
    assertEquals(await (await run()).json(), {
      processed: 0,
      results: [{ contact_id: contactId, ok: false, error: "Reserva substituída por uma nova solicitação" }],
    });
    assertEquals(retries, 0);
  } finally {
    await close();
  }
});

Deno.test("perfil admite usuário autenticado e exige cron e proprietário nas chamadas internas", async () => {
  let reads = 0;
  let contactOwner = ownerId;
  const close = await startHandler("generate-behavioral-profile", (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/auth/v1/user") return Response.json({ id: ownerId });
    if (url.pathname === "/rest/v1/contacts") return Response.json([{ user_id: contactOwner }]);
    if (url.pathname.startsWith("/rest/v1/")) { reads++; return Response.json([]); }
    return new Response(null, { status: 404 });
  });
  const submit = (userId: string, headers: Record<string, string>) => fetch("http://127.0.0.1:8000/", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ contact_id: contactId, user_id: userId }),
  });
  try {
    assertEquals((await submit(ownerId, {})).status, 401);
    assertEquals((await submit(foreignId, { Authorization: "Bearer sessao-teste" })).status, 422);
    assertEquals(reads, 3);
    contactOwner = foreignId;
    assertEquals((await submit(ownerId, { Authorization: "Bearer sessao-teste" })).status, 403);
    assertEquals(reads, 3);
    contactOwner = ownerId;
    assertEquals((await submit(ownerId, { Authorization: "Bearer servico-teste", "x-internal-key": "servico-teste" })).status, 401);
    const internalHeaders = { Authorization: "Bearer servico-teste", "x-internal-key": "servico-teste", "x-cron-secret": "cron-teste" };
    assertEquals((await submit(foreignId, internalHeaders)).status, 403);
    assertEquals(reads, 3);
    assertEquals((await submit(ownerId, internalHeaders)).status, 422);
    for (let attempt = 0; attempt < 19; attempt++) {
      assertEquals((await submit(ownerId, { Authorization: "Bearer sessao-teste" })).status, 422);
    }
    const limited = await submit(ownerId, { Authorization: "Bearer sessao-teste" });
    assertEquals(limited.status, 429);
    assert(limited.headers.get("Retry-After"));
  } finally {
    await close();
  }
});
