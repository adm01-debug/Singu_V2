import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTrackedNotification } from "./notification-delivery.ts";

const delivery = { reminder_id: "rem-1", contact_id: "contact-1", user_id: "user-1", channel: "whatsapp" as const };
const dbError = (code: string) => new Response(JSON.stringify({ code, message: "write denied" }), { status: 409 });

Deno.test("não envia quando o banco rejeita a reserva", async () => {
  let sends = 0;
  const client = createClient("https://example.test", "test-key", { global: { fetch: () => Promise.resolve(dbError("42501")) } });
  await assertRejects(() => sendTrackedNotification(client, delivery, () => {
    sends++;
    return Promise.resolve(new Response());
  }), Error, "reservar a entrega");
  assertEquals(sends, 0);
});

Deno.test("não repete a entrega quando o envio termina mas a confirmação falha", async () => {
  let reserved = false;
  let sends = 0;
  const client = createClient("https://example.test", "test-key", { global: { fetch: (_input, init) => {
    if (init?.method === "POST") {
      if (reserved) return Promise.resolve(dbError("23505"));
      reserved = true;
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return Promise.resolve(dbError("42501"));
  } } });
  const send = () => { sends++; return Promise.resolve(new Response()); };
  await assertRejects(() => sendTrackedNotification(client, delivery, send), Error, "confirmar a entrega");
  assertEquals(await sendTrackedNotification(client, delivery, send), "skipped");
  assertEquals(sends, 1);
});

Deno.test("confirma sucesso somente após persistir o estado enviado", async () => {
  const methods: string[] = [];
  const client = createClient("https://example.test", "test-key", { global: { fetch: (_input, init) => {
    methods.push(init?.method ?? "GET");
    return Promise.resolve(new Response(null, { status: 204 }));
  } } });
  assertEquals(await sendTrackedNotification(client, delivery, () => Promise.resolve(new Response())), "sent");
  assertEquals(methods, ["POST", "PATCH"]);
});

Deno.test("permite nova tentativa após rejeição HTTP confirmada", async () => {
  let reserved = false;
  let sends = 0;
  const client = createClient("https://example.test", "test-key", { global: { fetch: (_input, init) => {
    if (init?.method === "POST") {
      if (reserved) return Promise.resolve(dbError("23505"));
      reserved = true;
    } else if (init?.method === "DELETE") reserved = false;
    return Promise.resolve(new Response(null, { status: 204 }));
  } } });
  await assertRejects(() => sendTrackedNotification(client, delivery, () => {
    sends++;
    return Promise.resolve(new Response(null, { status: 401 }));
  }), Error, "Entrega rejeitada");
  assertEquals(await sendTrackedNotification(client, delivery, () => {
    sends++;
    return Promise.resolve(new Response());
  }), "sent");
  assertEquals(sends, 2);
});

Deno.test("preserva a reserva após timeout ou falha HTTP ambígua", async () => {
  for (const status of [408, 500, 504]) {
    let reserved = false;
    let sends = 0;
    const client = createClient("https://example.test", "test-key", { global: { fetch: (_input, init) => {
      if (init?.method === "POST") {
        if (reserved) return Promise.resolve(dbError("23505"));
        reserved = true;
      }
      return Promise.resolve(new Response(null, { status: 204 }));
    } } });
    const send = () => { sends++; return Promise.resolve(new Response(null, { status })); };
    await assertRejects(() => sendTrackedNotification(client, delivery, send), Error, "Entrega sem confirmação");
    assertEquals(await sendTrackedNotification(client, delivery, send), "skipped");
    assertEquals(sends, 1);
  }
});
