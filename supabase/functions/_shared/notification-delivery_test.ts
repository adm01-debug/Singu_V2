import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTrackedNotification } from "./notification-delivery.ts";

const delivery = { reminder_id: "rem-1", contact_id: "contact-1", user_id: "user-1", channel: "whatsapp" as const };
const dbError = (code: string) => new Response(JSON.stringify({ code, message: "write denied" }), { status: 409 });
const updated = () => new Response(JSON.stringify({ id: "log-1" }), { status: 200 });

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
    if (init?.method === "GET") return Promise.resolve(new Response(JSON.stringify([{ delivery_status: "pending" }])));
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
    return Promise.resolve(init?.method === "PATCH" ? updated() : new Response(null, { status: 204 }));
  } } });
  assertEquals(await sendTrackedNotification(client, delivery, () => Promise.resolve(new Response())), "sent");
  assertEquals(methods, ["POST", "PATCH"]);
});

Deno.test("permite nova tentativa após rejeição HTTP confirmada sem excluir a reserva", async () => {
  let status: "pending" | "rejected" | "sent" | null = null;
  let sends = 0;
  const methods: string[] = [];
  const client = createClient("https://example.test", "test-key", { global: { fetch: (_input, init) => {
    methods.push(init?.method ?? "GET");
    if (init?.method === "GET") return Promise.resolve(new Response(JSON.stringify([{ delivery_status: status }])));
    if (init?.method === "POST") {
      if (status) return Promise.resolve(dbError("23505"));
      status = "pending";
    } else if (init?.method === "PATCH") {
      const body = JSON.parse(String(init.body)) as { delivery_status: "pending" | "rejected" | "sent" };
      status = body.delivery_status;
      return Promise.resolve(updated());
    }
    return Promise.resolve(new Response(null, { status: 204 }));
  } } });
  await assertRejects(() => sendTrackedNotification(client, delivery, () => {
    sends++;
    return Promise.resolve(new Response(null, { status: 401 }));
  }), Error, "Entrega rejeitada");
  assertEquals(status, "rejected");
  assertEquals(await sendTrackedNotification(client, delivery, () => {
    sends++;
    return Promise.resolve(new Response());
  }), "sent");
  assertEquals(sends, 2);
  assertEquals(methods.includes("DELETE"), false);
});

Deno.test("preserva a reserva após timeout ou falha HTTP ambígua", async () => {
  for (const status of [408, 500, 504]) {
    let reserved = false;
    let sends = 0;
    const client = createClient("https://example.test", "test-key", { global: { fetch: (input, init) => {
      if (init?.method === "GET") return Promise.resolve(new Response(JSON.stringify([{ delivery_status: "unknown" }])));
      if (init?.method === "POST") {
        if (reserved) return Promise.resolve(dbError("23505"));
        reserved = true;
      }
      if (init?.method === "PATCH" && !String(input).includes("delivery_status=eq.rejected")) return Promise.resolve(updated());
      return Promise.resolve(new Response(null, { status: 204 }));
    } } });
    const send = () => { sends++; return Promise.resolve(new Response(null, { status })); };
    await assertRejects(() => sendTrackedNotification(client, delivery, send), Error, "Entrega sem confirmação");
    assertEquals(await sendTrackedNotification(client, delivery, send), "skipped");
    assertEquals(sends, 1);
  }
});

Deno.test("reserva rejeitada é retomada por apenas um envio concorrente", async () => {
  let status = "rejected";
  let sends = 0;
  const client = createClient("https://example.test", "test-key", { global: { fetch: (input, init) => {
    if (init?.method === "GET") return Promise.resolve(new Response(JSON.stringify([{ delivery_status: status }])));
    if (init?.method === "POST") return Promise.resolve(dbError("23505"));
    if (String(input).includes("delivery_status=eq.rejected")) {
      if (status !== "rejected") return Promise.resolve(new Response(null, { status: 204 }));
      status = "pending";
    }
    return Promise.resolve(updated());
  } } });
  const send = () => { sends++; return Promise.resolve(new Response()); };
  const results = await Promise.all([sendTrackedNotification(client, delivery, send), sendTrackedNotification(client, delivery, send)]);
  assertEquals(results.sort(), ["sent", "skipped"]);
  assertEquals(sends, 1);
});

Deno.test("não anuncia sucesso se a reserva não for confirmada no banco", async () => {
  const client = createClient("https://example.test", "test-key", { global: { fetch: () => Promise.resolve(new Response(null, { status: 204 })) } });
  await assertRejects(() => sendTrackedNotification(client, delivery, () => Promise.resolve(new Response())), Error, "confirmar a entrega");
});
