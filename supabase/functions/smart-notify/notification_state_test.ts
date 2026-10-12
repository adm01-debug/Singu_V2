import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTrackedNotification } from "../_shared/notification-delivery.ts";

type Handler = (request: Request) => Response | Promise<Response>;

Deno.test("reservas ativas ficam em processamento e órfãs exigem reconciliação sem reenvio", async () => {
  const serveDescriptor = Object.getOwnPropertyDescriptor(Deno, "serve");
  const envDescriptor = Object.getOwnPropertyDescriptor(Deno.env, "get");
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const user = "11111111-1111-4111-8111-111111111111";
  const contact = "22222222-2222-4222-8222-222222222222";
  const environment: Record<string, string> = {
    SUPABASE_URL: "https://supabase.example.test", SUPABASE_SERVICE_ROLE_KEY: "service-test",
    CRON_SECRET: "cron-test", EVOLUTION_API_KEY: "provider-test", EVOLUTION_API_URL: "https://provider.example.test",
  };
  let handler: Handler | undefined;
  let state = "pending";
  let expired = false;
  let claims = 0;
  let sends = 0;
  Object.defineProperty(Deno, "serve", { configurable: true, value: (callback: Handler) => { handler = callback; } });
  Object.defineProperty(Deno.env, "get", { configurable: true, value: (name: string) => environment[name] });
  console.error = () => {};
  globalThis.fetch = (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === "provider.example.test") { sends++; return Promise.resolve(new Response("{}")); }
    const table = url.pathname.split("/").at(-1);
    if (table === "notification_logs" && options?.method === "PATCH") {
      assertEquals(url.searchParams.get("delivery_status"), "eq.pending");
      assertEquals(url.searchParams.get("claim_expires_at")?.startsWith("lte."), true);
      if (expired && state === "pending") state = "unknown";
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (table === "notification_logs" && options?.method === "POST") {
      claims++; return Promise.resolve(new Response(null, { status: 201 }));
    }
    const rows = table === "profiles" ? [{ id: user, first_name: "Teste", email: null, phone: "5511999999999" }]
      : table === "contact_next_actions" ? [{ id: "action-test", action: "Retomar", urgency: "high", contact_id: contact,
        user_id: user, generated_at: new Date().toISOString(), contacts: { first_name: "Pessoa", last_name: "Teste" } }]
      : table === "contact_automation_settings" ? [{ contact_id: contact, escalation_enabled: false, reminder_enabled: true, delay_hours: 24 }]
      : [{ reminder_id: "nba-rem-action-test", channel: "whatsapp", delivery_status: state }];
    return Promise.resolve(new Response(JSON.stringify(rows), { headers: { "Content-Type": "application/json" } }));
  };
  try {
    await import("./index.ts?notification-state");
    if (!handler) throw new Error("Handler não capturado");
    const request = () => new Request("https://edge.example.test/smart-notify", {
      method: "POST", headers: { "x-cron-secret": "cron-test" },
    });
    const active = await handler(request());
    assertEquals(active.status, 202);
    const activeBody = await active.json();
    assertEquals(activeBody.success, false);
    assertEquals(activeBody.status, "processing");
    assertEquals(activeBody.stats.notificationsFailed, 0);
    expired = true;
    assertEquals((await handler(request())).status, 502);
    assertEquals(state, "unknown");
    state = "sent";
    assertEquals((await handler(request())).status, 200);
    assertEquals({ claims, sends }, { claims: 0, sends: 0 });
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    if (serveDescriptor) Object.defineProperty(Deno, "serve", serveDescriptor);
    if (envDescriptor) Object.defineProperty(Deno.env, "get", envDescriptor);
  }
});

Deno.test("405, 413 e 415 liberam somente a reserva rejeitada para uma nova tentativa", async () => {
  for (const status of [405, 413, 415]) {
    let reserved = false;
    let expiry: unknown;
    const client = createClient("https://supabase.example.test", "service-test", { global: { fetch: (_input, init) => {
      if (init?.method === "POST") {
        reserved = true;
        expiry = JSON.parse(String(init.body)).claim_expires_at;
      } else if (init?.method === "DELETE") reserved = false;
      return Promise.resolve(new Response(null, { status: 204 }));
    } } });
    const delivery = { reminder_id: "local", user_id: "user", contact_id: "contact", channel: "whatsapp" as const };
    let rejected = false;
    try { await sendTrackedNotification(client, delivery, () => Promise.resolve(new Response(null, { status }))); }
    catch { rejected = true; }
    assertEquals(rejected, true);
    assertEquals(reserved, false);
    assertEquals(typeof expiry, "string");
    assertEquals(await sendTrackedNotification(client, delivery, () => Promise.resolve(new Response())), "sent");
  }
});
