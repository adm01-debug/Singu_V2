import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

type Handler = (request: Request) => Response | Promise<Response>;

Deno.test("configuração inválida não reserva o lembrete e permite enviar após corrigir", async () => {
  const serveDescriptor = Object.getOwnPropertyDescriptor(Deno, "serve");
  const envDescriptor = Object.getOwnPropertyDescriptor(Deno.env, "get");
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const user = "11111111-1111-4111-8111-111111111111";
  const contact = "22222222-2222-4222-8222-222222222222";
  const environment: Record<string, string> = {
    SUPABASE_URL: "https://supabase.example.test",
    SUPABASE_SERVICE_ROLE_KEY: "service-test",
    CRON_SECRET: "cron-test",
    EVOLUTION_API_KEY: "provider-test",
    EVOLUTION_API_URL: "endereco-invalido",
  };
  let handler: Handler | undefined;
  let claims = 0;
  let sends = 0;
  Object.defineProperty(Deno, "serve", { configurable: true, value: (callback: Handler) => { handler = callback; } });
  Object.defineProperty(Deno.env, "get", { configurable: true, value: (name: string) => environment[name] });
  console.error = () => {};
  globalThis.fetch = (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === "provider.example.test") {
      sends++;
      return Promise.resolve(new Response("{}"));
    }
    if (url.pathname.endsWith("/notification_logs") && options?.method === "POST") {
      claims++;
      return Promise.resolve(new Response(null, { status: 201 }));
    }
    if (options?.method === "PATCH") {
      if (url.searchParams.has("claim_expires_at")) {
        assertEquals(url.searchParams.get("delivery_status"), "eq.pending");
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      assertEquals(JSON.parse(String(options.body)).delivery_status, "sent");
      assertEquals(url.searchParams.get("claim_token")?.startsWith("eq."), true);
      return Promise.resolve(new Response(JSON.stringify({ id: "notification-test" }), {
        headers: { "Content-Type": "application/json" },
      }));
    }
    const table = url.pathname.split("/").at(-1);
    const rows = table === "profiles" ? [{ id: user, first_name: "Teste", email: null, phone: "5511999999999" }]
      : table === "contact_next_actions" ? [{
        id: "action-test", action: "Retomar", urgency: "high", contact_id: contact, user_id: user,
        generated_at: new Date().toISOString(), contacts: { first_name: "Contato", last_name: "Teste" },
      }]
      : table === "contact_automation_settings" ? [{ contact_id: contact, reminder_enabled: true, delay_hours: 24, escalation_enabled: false }]
      : table === "notification_logs" ? [] : null;
    if (rows === null) throw new Error(`Rota não simulada: ${url.pathname}`);
    return Promise.resolve(new Response(JSON.stringify(rows), { headers: { "Content-Type": "application/json" } }));
  };
  try {
    await import("./index.ts");
    if (!handler) throw new Error("Handler não registrado");
    const invoke = () => handler!(new Request("https://function.example.test", { headers: { "x-cron-secret": "cron-test" } }));
    for (const invalid of ["endereco-invalido", "file:///arquivo", "https://usuario:senha@provider.example.test", "https://provider.example.test?token=teste"]) {
      environment.EVOLUTION_API_URL = invalid;
      assertEquals((await invoke()).status, 502);
    }
    assertEquals(claims, 0);
    assertEquals(sends, 0);
    environment.EVOLUTION_API_URL = "https://provider.example.test";
    assertEquals((await invoke()).status, 200);
    assertEquals(claims, 1);
    assertEquals(sends, 1);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    if (serveDescriptor) Object.defineProperty(Deno, "serve", serveDescriptor);
    if (envDescriptor) Object.defineProperty(Deno.env, "get", envDescriptor);
  }
});
