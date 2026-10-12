import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const ownerId = "11111111-1111-4111-8111-111111111111";
const foreignId = "22222222-2222-4222-8222-222222222222";
const contactId = "33333333-3333-4333-8333-333333333333";

async function startHandler(name: string, handler: (req: Request) => Response | Promise<Response>, mockAI = false) {
  const api = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handler);
  const child = new Deno.Command(Deno.execPath(), {
    args: ["run", "--node-modules-dir=none", "--allow-net", "--allow-env",
      mockAI ? "supabase/functions/_shared/behavioral-generation-mock.ts" : `supabase/functions/${name}/index.ts`],
    env: {
      HOME: Deno.env.get("HOME")!,
      SUPABASE_URL: `http://127.0.0.1:${api.addr.port}`,
      SUPABASE_ANON_KEY: "anon-teste",
      SUPABASE_SERVICE_ROLE_KEY: "servico-teste",
      CRON_SECRET: "cron-teste",
      ...(mockAI ? { LOVABLE_API_KEY: "ia-simulada" } : {}),
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

Deno.test("geração manual lê com o usuário e confirma pelo serviço após validar o proprietário", async () => {
  const readTokens: Array<string | null> = [];
  const confirmations: Array<Record<string, unknown>> = [];
  let rejectOwner = false;
  const close = await startHandler("generate-behavioral-profile", async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/auth/v1/user") return Response.json({ id: ownerId });
    if (url.pathname === "/rest/v1/contacts") return Response.json([{ user_id: ownerId }]);
    if (url.pathname === "/rest/v1/rpc/save_behavioral_profile_if_fresh") {
      assertEquals(req.headers.get("Authorization"), "Bearer servico-teste");
      const body: Record<string, unknown> = await req.json();
      confirmations.push(body);
      return rejectOwner
        ? Response.json({ message: "Proprietário do perfil divergente", code: "42501" }, { status: 403 })
        : Response.json({ id: contactId, contact_id: contactId, user_id: ownerId, summary: "Análise confirmada" });
    }
    if (url.pathname.startsWith("/rest/v1/")) {
      if (["/rest/v1/whatsapp_messages", "/rest/v1/call_logs", "/rest/v1/interactions", "/rest/v1/behavioral_insight_feedback"].includes(url.pathname)) {
        readTokens.push(req.headers.get("Authorization"));
      }
      return Response.json(url.pathname === "/rest/v1/interactions"
        ? [{ content: "Histórico do proprietário", type: "note", created_at: new Date().toISOString() }] : []);
    }
    return new Response(null, { status: 404 });
  }, true);
  const submit = () => fetch("http://127.0.0.1:8000/", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer sessao-teste" },
    body: JSON.stringify({ contact_id: contactId, user_id: foreignId, claim_token: foreignId }),
  });
  try {
    const confirmed = await submit();
    assertEquals(confirmed.status, 200);
    await confirmed.json();
    assert(readTokens.length >= 3);
    assertEquals(readTokens, readTokens.map(() => "Bearer sessao-teste"));
    assertEquals(confirmations[0].p_claim_token, null);
    assertEquals(confirmations[0].p_trigger_source, "manual");
    assertEquals((confirmations[0].p_profile as { user_id: string }).user_id, ownerId);
    rejectOwner = true;
    const refused = await submit();
    assertEquals(refused.status, 503);
    await refused.json();
  } finally {
    await close();
  }
});

Deno.test("cron SLA só invoca com reserva e exige recibo sem recriar a fila concluída", async () => {
  const claimToken = "55555555-5555-4555-8555-555555555555";
  let reserved = false;
  let missingReceipt = false;
  let calls = 0;
  const writes: string[] = [];
  const close = await startHandler("auto-regen-behavioral-profiles", async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/rest/v1/behavioral_insight_feedback") {
      return Response.json(Array.from({ length: 3 }, () => ({
        contact_id: contactId, user_id: ownerId, vote: -1, created_at: new Date().toISOString(),
      })));
    }
    if (url.pathname === "/rest/v1/rpc/claim_behavioral_profile_sla") {
      assertEquals(await req.json(), { p_contact_id: contactId, p_user_id: ownerId });
      return Response.json(reserved ? { contact_id: contactId, user_id: ownerId, claim_token: claimToken } : null);
    }
    if (url.pathname === "/functions/v1/generate-behavioral-profile") {
      calls++;
      assertEquals(await req.json(), { contact_id: contactId, user_id: ownerId,
        claim_token: claimToken, trigger: "auto_regen_sla" });
      assertEquals(req.headers.get("x-cron-secret"), "cron-teste");
      return Response.json(missingReceipt ? { ok: true } : { profile: { contact_id: contactId, user_id: ownerId } });
    }
    if (url.pathname === "/rest/v1/behavioral_profile_regen_queue") {
      if (req.method !== "GET") {
        writes.push(req.method);
        assertEquals(url.searchParams.get("claim_token"), `eq.${claimToken}`);
      }
      return Response.json([]);
    }
    if (url.pathname === "/rest/v1/system_alerts") return Response.json([]);
    return new Response(null, { status: 404 });
  });
  const run = () => fetch("http://127.0.0.1:8000/", { method: "POST", headers: { "x-cron-secret": "cron-teste" } });
  try {
    assertEquals((await (await run()).json()).processed, 0);
    assertEquals(calls, 0);
    assertEquals(writes, []);
    reserved = true;
    assertEquals((await (await run()).json()).processed, 1);
    assertEquals(writes, []);
    missingReceipt = true;
    const failed = await (await run()).json();
    assertEquals(failed.processed, 0);
    assertEquals(failed.failures[0].error, "Perfil persistido não confirmado");
    assertEquals(calls, 2);
    assertEquals(writes, ["PATCH"]);
  } finally {
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
  let missingReceipt = false;
  const updates: Array<Record<string, unknown>> = [];
  const close = await startHandler("validation-queue-worker", async (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/rest/v1/rpc/claim_validation_batch") {
      assertEquals(await req.json(), { p_batch_size: 10, p_max_attempts: 3 });
      return Response.json([{ id: itemId, user_id: ownerId, contact_id: contactId, kind: "phone", value: "+5511999999999", attempts, claim_token: claimToken }]);
    }
    if (url.pathname === "/functions/v1/phone-validator") {
      assertEquals(req.headers.get("Authorization"), "Bearer servico-teste");
      assertEquals(await req.json(), { phone: "+5511999999999", contactId, userId: ownerId, persist: true, queueId: itemId, claimToken });
      return Response.json(missingReceipt ? {} : { queueId: itemId, validationId: itemId }, { status: rejectValidation ? 503 : 200 });
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
    assertEquals(updates.length, 0);
    rejectValidation = true;
    assertEquals(await (await run()).json(), { processed: 1, ok: 0, errors: 1 });
    assertEquals(updates[0].status, "pending");
    assertEquals(updates[0].attempts, 1);
    assertEquals(updates[0].claim_token, null);
    assertEquals(updates[0].lease_expires_at, null);
    attempts = 3;
    await run();
    assertEquals(updates[1].status, "error");
    assert(updates[1].processed_at);
    stale = true;
    assertEquals(await (await run()).json(), { processed: 0, ok: 0, errors: 0 });
    rejectUpdate = true;
    assertEquals((await run()).status, 500);
    rejectValidation = false;
    rejectUpdate = false;
    stale = false;
    missingReceipt = true;
    assertEquals(await (await run()).json(), { processed: 1, ok: 0, errors: 1 });
    assertEquals(updates.at(-1)?.status, "error");
  } finally {
    await close();
  }
});

Deno.test("validação da fila aguarda o recibo atômico e recusa confirmação sem reserva interna", async () => {
  const queueId = "44444444-4444-4444-8444-444444444444";
  const claimToken = "55555555-5555-4555-8555-555555555555";
  let rejected = false;
  let replaced = false;
  const receipts: Array<Record<string, unknown>> = [];
  const close = await startHandler("phone-validator", async req => {
    const url = new URL(req.url);
    if (url.pathname === "/auth/v1/user") return Response.json({ id: ownerId });
    if (url.pathname === "/rest/v1/contacts") return Response.json([{ id: contactId }]);
    if (url.pathname === "/rest/v1/rpc/complete_validation_queue_item") {
      const payload = await req.json();
      assertEquals(payload.p_queue_id, queueId);
      assertEquals(payload.p_claim_token, claimToken);
      assertEquals(payload.p_user_id, ownerId);
      assertEquals(payload.p_contact_id, contactId);
      assertEquals(payload.p_kind, "phone");
      assertEquals(payload.p_value, "+5511999999999");
      receipts.push(payload);
      return rejected ? Response.json({ message: "Falha na transação" }, { status: 503 })
        : Response.json(replaced ? null : queueId);
    }
    throw new Error("Operação inesperada: " + url.pathname);
  });
  const submit = (token = "servico-teste", fields: Record<string, unknown> = {}) => fetch("http://127.0.0.1:8000/", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ phone: "+5511999999999", userId: ownerId, contactId, queueId, claimToken, ...fields }),
  });
  try {
    assertEquals((await submit("sessao-teste")).status, 403);
    assertEquals((await submit("servico-teste", { claimToken: null })).status, 400);
    assertEquals(receipts.length, 0);
    const confirmed = await submit();
    assertEquals(confirmed.status, 200);
    assertEquals((await confirmed.json()).validationId, queueId);
    assertEquals((await submit()).status, 200);
    replaced = true;
    assertEquals((await submit()).status, 409);
    rejected = true;
    assertEquals((await submit()).status, 503);
  } finally { await close(); }
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

Deno.test("worker de perfis aceita conclusão atômica e rejeita recibo ausente", async () => {
  const claimToken = "55555555-5555-4555-8555-555555555555";
  let missingReceipt = false;
  const writes: string[] = [];
  const close = await startHandler("process-behavioral-regen-queue", (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/rest/v1/rpc/claim_regen_batch") {
      return Response.json([{ contact_id: contactId, user_id: ownerId, attempts: 1, claim_token: claimToken }]);
    }
    if (url.pathname === "/functions/v1/generate-behavioral-profile") {
      return Response.json(missingReceipt ? { ok: true } : { profile: { contact_id: contactId, user_id: ownerId } });
    }
    if (url.pathname === "/rest/v1/behavioral_profile_regen_queue") {
      writes.push(req.method);
      assertEquals(url.searchParams.get("claim_token"), `eq.${claimToken}`);
      return Response.json([]);
    }
    return new Response(null, { status: 404 });
  });
  const submit = () => fetch("http://127.0.0.1:8000/", {
    method: "POST", headers: { "x-cron-secret": "cron-teste" },
  });
  try {
    const confirmed = await submit();
    assertEquals(confirmed.status, 200);
    const receipt = await confirmed.json();
    assertEquals(receipt.processed, 1);
    assertEquals(receipt.results[0].ok, true);
    assertEquals(writes, []);

    missingReceipt = true;
    const unconfirmed = await submit();
    const failure = await unconfirmed.json();
    assertEquals(failure.processed, 0);
    assertEquals(failure.results[0].ok, false);
    assertEquals(writes, ["PATCH"]);
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
