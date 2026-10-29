import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { withHandler } from "./edge-test-harness.ts";

const auth = { apikey: "evolution-teste" };
const ownerA = "11111111-1111-4111-8111-111111111111";
const ownerB = "22222222-2222-4222-8222-222222222222";
const contactA = "33333333-3333-4333-8333-333333333333";
const contactB = "44444444-4444-4444-8444-444444444444";
const phone = "5511999999999";
const message = { key: { id: "mensagem-1", remoteJid: `${phone}@s.whatsapp.net` }, message: { conversation: "Olá" } };
const dataByEvent = {
  "messages.upsert": message, "messages.update": { key: message.key, update: { status: "READ" } },
  "send.message": { key: message.key }, "connection.update": { state: "open" },
  "contacts.upsert": { id: `${phone}@s.whatsapp.net`, pushName: "Contato", profilePictureUrl: "https://avatar.invalid/foto" },
  call: { from: `${phone}@s.whatsapp.net` }, "presence.update": { id: "presenca" },
};
function fixture(options: { localA?: boolean; external?: boolean; fail?: string; existingOwner?: string; existingInstance?: string } = {}) {
  const requests: Array<{ table: string; method: string; params: URLSearchParams; body?: Record<string, unknown> }> = [];
  const contacts = [{ id: contactB, user_id: ownerB, company_id: null },
    ...(options.localA === false ? [] : [{ id: contactA, user_id: ownerA, company_id: null }])];
  const messages: Record<string, unknown>[] = options.existingOwner ? [{ id: "db-mensagem", message_id: "mensagem-1", user_id: options.existingOwner, instance_name: options.existingInstance ?? "a", content: "Original" }] : [];
  const backend = async (req: Request) => {
    const url = new URL(req.url);
    const table = url.pathname.startsWith("/external/") ? "external" : url.pathname.split("/").pop()!;
    const body = req.method === "GET" ? undefined : await req.json();
    const call = { table, method: req.method, params: url.searchParams, body };
    requests.push(call);
    if (table === options.fail) return Response.json({ code: "XX000", message: "Falha simulada" }, { status: 500 });
    if (table === "whatsapp_instances" && req.method === "GET") {
      const instance = url.searchParams.get("instance_name");
      return Response.json(instance === "eq.ausente" ? [] : instance === "eq.ambiguo" ? [{ user_id: ownerA }, { user_id: ownerB }] :
        [{ user_id: instance === "eq.b" ? ownerB : ownerA }]);
    }
    if ((table === "contacts" || table === "external") && req.method === "GET") {
      const rows = table === "external" ? [{ id: contactB, user_id: ownerB, company_id: null }, { id: contactA, user_id: ownerA, company_id: null }] : contacts;
      const scoped = url.searchParams.get("user_id");
      return Response.json((scoped ? rows.filter(row => `eq.${row.user_id}` === scoped) : rows).slice(0, 1));
    }
    if (table === "contacts" && req.method === "POST") return Response.json({ id: contactA, ...body, company_id: null });
    if (table === "whatsapp_messages") {
      if (req.method === "POST") {
        if (messages.length && !req.headers.get("prefer")?.includes("merge-duplicates")) {
          return Response.json({ code: "23505", message: "ID existente" }, { status: 409 });
        }
        const row = { id: "db-mensagem", ...body };
        messages.splice(0, messages.length, row);
        return Response.json(row);
      }
      const rows = messages.filter(row => [...url.searchParams].every(([key, value]) => key === "select" || value === `eq.${row[key]}`));
      if (req.method === "GET") return Response.json(rows);
      for (const row of rows) Object.assign(row, body);
      return Response.json(rows);
    }
    if (table === "interactions") return Response.json({ id: "interacao", ...body });
    return new Response(null, { status: 204 });
  };
  return { backend, requests, messages };
}

Deno.test("Evolution associa o telefone compartilhado somente ao dono da instância", async () => {
  const f = fixture();
  await withHandler("evolution-webhook", f.backend, async submit => {
    for (const [instance, userId, contactId] of [["a", ownerA, contactA], ["b", ownerB, contactB]]) {
      f.messages.length = 0;
      const response = await submit({ event: "messages.upsert", instance, data: message }, auth);
      assertEquals(response.status, 200);
      assertEquals((await response.json()).contactId, contactId);
      assertEquals(f.messages[0].user_id, userId);
      const interaction = f.requests.filter(row => row.table === "interactions").at(-1)!;
      assertEquals(interaction.body?.user_id, userId);
      assertEquals(interaction.body?.contact_id, contactId);
    }
    assertEquals(f.requests.some(row => row.table === "profiles"), false);
  });
});

Deno.test("Evolution não inventa dono para instância ausente ou ambígua em nenhum evento", async () => {
  const f = fixture();
  await withHandler("evolution-webhook", f.backend, async submit => {
    for (const instance of ["ausente", "ambiguo"]) for (const [event, data] of Object.entries(dataByEvent)) {
      const response = await submit({ event, instance, data }, auth);
      assertEquals(response.status, 403);
      await response.body?.cancel();
    }
    assertEquals(f.requests.every(row => row.table === "whatsapp_instances" && row.method === "GET"), true);
  });
});

Deno.test("Evolution não cria contato após erro de consulta de dono ou telefone", async () => {
  for (const fail of ["whatsapp_instances", "contacts", "external"]) {
    const f = fixture({ fail, localA: fail === "external" ? false : true });
    await withHandler("evolution-webhook", f.backend, async submit => {
      const response = await submit({ event: "messages.upsert", instance: "a", data: message }, auth);
      assertEquals(response.status, 500);
      await response.body?.cancel();
      assertEquals(f.requests.some(row => row.method !== "GET"), false);
    }, false, fail === "external" ? base => ({ EXTERNAL_SUPABASE_URL: `${base}/external`, EXTERNAL_SUPABASE_SERVICE_ROLE_KEY: "externo-simulado" }) : undefined);
  }
});

Deno.test("Evolution cria contato para o dono resolvido sem recorrer a profiles", async () => {
  const f = fixture({ localA: false });
  await withHandler("evolution-webhook", f.backend, async submit => {
    const response = await submit({ event: "messages.upsert", instance: "a", data: message }, auth);
    assertEquals(response.status, 200);
    await response.body?.cancel();
    assertEquals(f.requests.find(row => row.table === "contacts" && row.method === "POST")?.body?.user_id, ownerA);
    assertEquals(f.requests.some(row => row.table === "profiles"), false);
  });
});

Deno.test("Evolution restringe busca externa ao mesmo dono confirmado", async () => {
  const f = fixture({ localA: false, external: true });
  await withHandler("evolution-webhook", f.backend, async submit => {
    const response = await submit({ event: "messages.upsert", instance: "a", data: message }, auth);
    assertEquals(response.status, 200);
    assertEquals((await response.json()).contactId, contactA);
    assertEquals(f.requests.find(row => row.table === "external")?.params.get("user_id"), `eq.${ownerA}`);
    assertEquals(f.messages[0].user_id, ownerA);
  }, false, base => ({ EXTERNAL_SUPABASE_URL: `${base}/external`, EXTERNAL_SUPABASE_SERVICE_ROLE_KEY: "externo-simulado" }));
});

Deno.test("Evolution limita atualizações a proprietário e instância corretos", async () => {
  const f = fixture({ existingOwner: ownerB, existingInstance: "b" });
  await withHandler("evolution-webhook", f.backend, async submit => {
    for (const event of ["messages.update", "send.message", "contacts.upsert", "connection.update", "call"] as const) {
      const response = await submit({ event, instance: "a", data: dataByEvent[event] }, auth);
      assertEquals(response.status, 200);
      await response.body?.cancel();
    }
    for (const call of f.requests.filter(row => row.method === "PATCH")) {
      assertEquals(call.params.get("user_id"), `eq.${ownerA}`);
      if (call.table !== "contacts") assertEquals(call.params.get("instance_name"), "eq.a");
    }
    assertEquals(f.messages[0].status, undefined);
    assertEquals(f.requests.find(row => row.table === "interactions")?.body?.user_id, ownerA);
  });
});

Deno.test("Evolution não sobrescreve message_id pertencente a outro dono ou instância", async () => {
  for (const [existingOwner, existingInstance] of [[ownerB, "b"], [ownerA, "a2"]]) {
    const f = fixture({ existingOwner, existingInstance });
    await withHandler("evolution-webhook", f.backend, async submit => {
      const response = await submit({ event: "messages.upsert", instance: "a", data: message }, auth);
      assertEquals(response.status, 500);
      await response.body?.cancel();
      assertEquals(f.messages[0].content, "Original");
      assertEquals(f.messages[0].user_id, existingOwner);
      assertEquals(f.requests.some(row => row.table === "interactions" || row.table === "voice-to-text"), false);
    });
  }
});

Deno.test("Evolution confirma repetição da mesma mensagem sem trocar seu escopo", async () => {
  const f = fixture({ existingOwner: ownerA });
  await withHandler("evolution-webhook", f.backend, async submit => {
    const response = await submit({ event: "messages.upsert", instance: "a", data: message }, auth);
    assertEquals(response.status, 200);
    await response.body?.cancel();
    assertEquals(f.messages.length, 1);
    assertEquals(f.messages[0].content, "Olá");
    assertEquals(f.messages[0].user_id, ownerA);
    assertEquals(f.messages[0].instance_name, "a");
  });
});
