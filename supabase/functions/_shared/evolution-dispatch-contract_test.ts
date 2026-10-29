import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { withEvolutionHandler } from "./edge-test-harness.ts";

const auth = { apikey: "evolution-teste" };
const owner = "11111111-1111-4111-8111-111111111111";
const contact = "22222222-2222-4222-8222-222222222222";

Deno.test("dispatcher Evolution mantém mensagens.update e ignora atualização sem chave", async () => {
  const writes: Array<Record<string, unknown>> = [];
  await withEvolutionHandler(async req => {
    assertEquals(req.method, "PATCH");
    const url = new URL(req.url);
    assertEquals(url.pathname, "/rest/v1/whatsapp_messages");
    assertEquals(url.searchParams.get("message_id"), "eq.mensagem-1");
    writes.push(await req.json());
    return new Response(null, { status: 204 });
  }, async submit => {
    for (const [status, expected] of [[3, "delivered"], ["READ", "read"], [5, "played"]] as const) {
      const response = await submit({ event: "messages.update", instance: "teste", data: {
        key: { id: "mensagem-1" }, update: { status },
      } }, auth);
      assertEquals(response.status, 200);
      assertEquals((await response.json()).updates.status, expected);
      assertEquals(writes.at(-1)?.status, expected);
    }
    const response = await submit({ event: "messages.update", instance: "teste", data: {} }, auth);
    assertEquals(await response.json(), { status: "ignored", reason: "no message key" });
    assertEquals(writes.length, 3);
  });
});

Deno.test("dispatcher Evolution mantém transições de conexão por instância", async () => {
  const writes: Array<Record<string, unknown>> = [];
  await withEvolutionHandler(async req => {
    const url = new URL(req.url);
    assertEquals(req.method, "PATCH");
    assertEquals(url.pathname, "/rest/v1/whatsapp_instances");
    assertEquals(url.searchParams.get("instance_name"), "eq.teste");
    writes.push(await req.json());
    return new Response(null, { status: 204 });
  }, async submit => {
    for (const [state, status] of [["open", "connected"], ["close", "disconnected"], ["connecting", "connecting"]]) {
      const response = await submit({ event: "connection.update", instance: "teste", data: { state } }, auth);
      assertEquals(await response.json(), { status: "success", instance: "teste", state });
      assertEquals(writes.at(-1)?.status, status);
      assertEquals(typeof writes.at(-1)?.last_connected_at, state === "open" ? "string" : "undefined");
    }
  });
});

Deno.test("dispatcher Evolution mantém contato e seus filtros sem criar gravação para corpo vazio", async () => {
  let writes = 0;
  await withEvolutionHandler(async req => {
    writes++;
    const url = new URL(req.url);
    assertEquals(req.method, "PATCH");
    assertEquals(url.pathname, "/rest/v1/contacts");
    assertEquals(url.searchParams.get("or"), "(whatsapp.eq.5511999999999,phone.eq.5511999999999)");
    assertEquals(url.searchParams.get("avatar_url"), "not.is.null");
    assertEquals((await req.json()).avatar_url, "https://avatar.invalid/foto");
    return new Response(null, { status: 204 });
  }, async submit => {
    let response = await submit({ event: "contacts.upsert", instance: "teste", data: {} }, auth);
    assertEquals(await response.json(), { status: "ignored", reason: "no contact data" });
    response = await submit({ event: "contacts.upsert", instance: "teste", data: {
      id: "5511999999999@s.whatsapp.net", pushName: "Maria", profilePictureUrl: "https://avatar.invalid/foto",
    } }, auth);
    assertEquals(await response.json(), { status: "success", phone: "5511999999999" });
    assertEquals(writes, 1);
  });
});

Deno.test("dispatcher Evolution mantém presença e eventos desconhecidos sem gravar", async () => {
  await withEvolutionHandler(() => { throw new Error("Gravação indevida"); }, async submit => {
    let response = await submit({ event: "presence.update", instance: "teste", data: { id: "presenca-1" } }, auth);
    assertEquals(await response.json(), { status: "logged", presenceId: "presenca-1" });
    response = await submit({ event: "evento.novo", instance: "teste", data: {} }, auth);
    assertEquals(await response.json(), { status: "ignored", event: "evento.novo" });
  });
});

Deno.test("dispatcher Evolution mantém chamada, contato e interação de vídeo", async () => {
  const interactions: Array<Record<string, unknown>> = [];
  await withEvolutionHandler(async req => {
    const url = new URL(req.url);
    if (req.method === "GET") {
      assertEquals(url.pathname, "/rest/v1/contacts");
      return Response.json([{ id: contact, user_id: owner, company_id: "empresa-1" }]);
    }
    assertEquals(url.pathname, "/rest/v1/interactions");
    interactions.push(await req.json());
    return new Response(null, { status: 201 });
  }, async submit => {
    const response = await submit({ event: "call", instance: "teste", data: {
      from: "5511999999999@s.whatsapp.net", isVideo: true, status: "recebida",
    } }, auth);
    assertEquals(await response.json(), { status: "success", from: "5511999999999" });
    assertEquals(interactions.length, 1);
    assertEquals(interactions[0].user_id, owner);
    assertEquals(interactions[0].contact_id, contact);
    assertEquals(interactions[0].type, "call");
    assertEquals(interactions[0].tags, ["evolution-api", "auto-imported", "video-call"]);
  });
});

Deno.test("dispatcher Evolution mantém confirmação de envio e chave de mensagem", async () => {
  let writes = 0;
  await withEvolutionHandler(async req => {
    writes++;
    const url = new URL(req.url);
    assertEquals(req.method, "PATCH");
    assertEquals(url.pathname, "/rest/v1/whatsapp_messages");
    assertEquals(url.searchParams.get("message_id"), "eq.mensagem-1");
    assertEquals((await req.json()).status, "sent");
    return new Response(null, { status: 204 });
  }, async submit => {
    for (const data of [{}, { key: { id: "mensagem-1" } }]) {
      const response = await submit({ event: "send.message", instance: "teste", data }, auth);
      assertEquals(await response.json(), { status: "success" });
    }
    assertEquals(writes, 1);
  });
});

Deno.test("dispatcher Evolution conserva o tratamento anterior para data em lista", async () => {
  const writes: Array<{ path: string; body: unknown }> = [];
  await withEvolutionHandler(async req => {
    writes.push({ path: new URL(req.url).pathname, body: await req.json() });
    return new Response(null, { status: 204 });
  }, async submit => {
    const fixtures = [
      ["messages.upsert", [{ key: { id: "mensagem-1" }, message: { conversation: "Olá" } }],
        { status: "ignored", reason: "no text content" }],
      ["messages.update", [{ key: { id: "mensagem-1" }, update: { status: "READ" } }],
        { status: "ignored", reason: "no message key" }],
      ["contacts.upsert", [{ id: "5511999999999@s.whatsapp.net" }],
        { status: "ignored", reason: "no contact data" }],
      ["presence.update", [{ id: "presenca-1" }], { status: "logged" }],
      ["call", [{ from: "5511999999999@s.whatsapp.net" }], { status: "success" }],
      ["send.message", [{ key: { id: "mensagem-1" } }], { status: "success" }],
      ["connection.update", [{ state: "open" }], { status: "success", instance: "teste" }],
    ] as const;
    for (const [event, data, expected] of fixtures) {
      const response = await submit({ event, instance: "teste", data }, auth);
      assertEquals(response.status, 200);
      assertEquals(await response.json(), expected);
    }
    assertEquals(writes.length, 1);
    assertEquals(writes[0].path, "/rest/v1/whatsapp_instances");
    assertEquals(writes[0].body && typeof writes[0].body === "object" && "status" in writes[0].body && writes[0].body.status, "connecting");
  });
});
