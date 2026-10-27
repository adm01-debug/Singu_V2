import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { withHandler } from "./edge-test-harness.ts";

const owner = "11111111-1111-4111-8111-111111111111";
const contact = "22222222-2222-4222-8222-222222222222";
const denied = () => Response.json({ message: "Simulação de indisponibilidade", code: "42501" }, { status: 403 });

Deno.test("formulário preserva RPC válida e rejeita bodies sem objeto ou dados válidos", async () => {
  const calls: unknown[] = [];
  await withHandler("form-submit-handler", async req => {
    assertEquals(new URL(req.url).pathname, "/rest/v1/rpc/submit_public_form");
    calls.push(await req.json());
    return Response.json({ submission_id: "form-1" });
  }, async submit => {
    for (const body of [null, [], "texto", 42, {}, { slug: "teste", data: [] }]) {
      const response = await submit(body);
      assertEquals(response.status, 400);
      await response.body?.cancel();
    }
    assertEquals(calls.length, 0);
    const response = await submit({ slug: "teste", data: { name: "Maria" } });
    assertEquals(response.status, 200);
    assertEquals(await response.json(), { ok: true, submission_id: "form-1" });
    assertEquals(calls, [{ _slug: "teste", _data: { name: "Maria" }, _utms: {}, _page_url: null, _user_agent: null }]);
  });
});

Deno.test("Evolution preserva autenticação e ingestão mesmo quando log best-effort é recusado", async () => {
  const writes: string[] = [];
  await withHandler("evolution-webhook", req => {
    const table = new URL(req.url).pathname.split("/").pop()!;
    if (req.method === "GET" && table === "contacts") return Response.json([{ id: contact, user_id: owner, company_id: null }]);
    writes.push(table);
    if (table === "whatsapp_messages") return Response.json({ id: "message-1" });
    if (table === "whatsapp_ingestion_logs") return denied();
    if (table === "interactions") return Response.json({ id: "interaction-1" });
    throw new Error(`Consulta inesperada: ${table}`);
  }, async submit => {
    const unauthorized = await submit({ event: "messages.upsert", instance: "teste" });
    assertEquals(unauthorized.status, 401);
    await unauthorized.body?.cancel();
    for (const instance of [undefined, 123, {}]) {
      const invalid = await submit({ event: "messages.upsert", instance }, { apikey: "evolution-teste" });
      assertEquals(invalid.status, 400);
      await invalid.body?.cancel();
    }
    assertEquals(writes, []);
    const response = await submit({ event: "messages.upsert", instance: "teste", data: {
      key: { remoteJid: "5511999999999@s.whatsapp.net", fromMe: false, id: "message-1" },
      message: { conversation: "Olá" }, pushName: "Maria",
    } }, { apikey: "evolution-teste" });
    assertEquals(response.status, 200);
    assertEquals((await response.json()).contactId, contact);
    assertEquals(writes, ["whatsapp_messages", "whatsapp_ingestion_logs", "interactions"]);
  });
});

Deno.test("Lux usa registro pré-carregado, preserva allowlist e tolera recusa de contatos auxiliares", async () => {
  const writes: Array<{ table: string; body: unknown }> = [];
  await withHandler("lux-webhook", async req => {
    const table = new URL(req.url).pathname.split("/").pop()!;
    if (req.method === "GET") return Response.json({ entity_type: "company", entity_id: "empresa-1", user_id: owner });
    writes.push({ table, body: await req.json() });
    return table === "contacts" ? denied() : new Response(null, { status: 204 });
  }, async submit => {
    const response = await submit({ luxRecordId: "lux-1", entityUpdates: { name: "Acme", user_id: "outro" },
      stakeholders: [{ name: "Maria Silva" }] }, { "x-lux-secret": "lux-teste" });
    assertEquals(response.status, 200);
    assertEquals(await response.json(), { success: true });
    assertEquals(writes.find(row => row.table === "companies")?.body, { name: "Acme" });
    const contacts = writes.find(row => row.table === "contacts")?.body as Array<Record<string, unknown>>;
    assertEquals(contacts[0].user_id, owner);
    assertEquals(contacts[0].company_id, "empresa-1");
  });
});

Deno.test("DLQ mantém webhooks completos no Map e separa ativo, ausente e inativo", async () => {
  const inserts: unknown[] = [];
  await withHandler("process-webhook-dlq", async req => {
    const table = new URL(req.url).pathname.split("/").pop()!;
    if (req.method === "GET" && table === "incoming_webhook_dlq") {
      return Response.json(["ativo", "ausente", "inativo"].map((id, i) => ({ id, webhook_id: id,
        payload: { nome: "Maria" }, attempts: i, max_attempts: 5 })));
    }
    if (req.method === "GET" && table === "incoming_webhooks") return Response.json([
      { id: "ativo", is_active: true, field_mapping: { first_name: "nome" }, target_entity: "contact", created_by: owner },
      { id: "inativo", is_active: false },
    ]);
    if (table === "contacts") inserts.push(await req.json());
    return new Response(null, { status: 204 });
  }, async submit => {
    const response = await submit({}, { "x-cron-secret": "cron-teste" });
    assertEquals(response.status, 200);
    assertEquals(await response.json(), { processed: 3, results: [
      { id: "ausente", status: "abandoned" }, { id: "inativo", status: "abandoned" }, { id: "ativo", status: "succeeded" },
    ] });
    assertEquals(inserts, [[{ first_name: "Maria", user_id: owner }]]);
  });
});

Deno.test("playbook opcional não ganha cenário e cenário discovery mantém pontuação", async () => {
  await withHandler("playbook-recommender", () => Response.json([
    { id: "sem-cenario", stage_target: "lead" },
    { id: "discovery", stage_target: "lead", scenario: "discovery" },
  ]), async submit => {
    const response = await submit({ current_stage: "lead" }, { Authorization: "Bearer sessao-teste" });
    assertEquals(response.status, 200);
    const body = await response.json();
    assertEquals(body.recommendations.map((row: { score: number }) => row.score), [65, 40]);
  });
});

Deno.test("win-loss mantém relação razão muitos-para-um e razão nula sem assertions forçadas", async () => {
  await withHandler("win-loss-analyzer", () => Response.json([
    { outcome: "lost", deal_value: 50, primary_reason_id: "razao-1", competitor_id: null,
      win_loss_reasons: { id: "razao-1", label: "Preço", category: "pricing" } },
    { outcome: "lost", deal_value: 75, primary_reason_id: "razao-2", competitor_id: null, win_loss_reasons: null },
    { outcome: "won", deal_value: 100, primary_reason_id: null, competitor_id: null, win_loss_reasons: null },
  ]), async submit => {
    const response = await submit({}, { Authorization: "Bearer sessao-teste" });
    assertEquals(response.status, 200);
    const { aggregate } = await response.json();
    assertEquals(aggregate.win_rate, 33.3);
    assertEquals(aggregate.avg_won_value, 100);
    assertEquals(aggregate.top_loss_reasons, [
      { id: "razao-1", label: "Preço", count: 1 }, { id: "razao-2", label: "?", count: 1 },
    ]);
  });
});

Deno.test("assinatura expirada ou pendente mantém resposta quando registro auxiliar falha", async () => {
  let expired = true;
  const writes: string[] = [];
  await withHandler("get-signature", req => {
    const table = new URL(req.url).pathname.split("/").pop()!;
    if (req.method === "GET") return Response.json({ id: "assinatura-1", status: "pending",
      expires_at: expired ? "2000-01-01T00:00:00Z" : null });
    writes.push(table);
    return expired || table === "document_views" ? denied() : new Response(null, { status: 204 });
  }, async submit => {
    let response = await submit({ token: "token-teste-assinatura" });
    assertEquals(response.status, 200);
    assertEquals((await response.json()).status, "expired");
    expired = false;
    response = await submit({ token: "token-teste-assinatura" });
    assertEquals(response.status, 200);
    assertEquals((await response.json()).status, "viewed");
    assertEquals(writes, ["document_signatures", "document_signatures", "document_views"]);
  });
});

Deno.test("bloqueios IP e geográfico permanecem negados mesmo sem gravar log", async () => {
  let logs = 0;
  await withHandler("validate-access", req => {
    const table = new URL(req.url).pathname.split("/").pop()!;
    if (table === "access_security_settings") return Response.json({ enable_ip_restriction: true, enable_geo_blocking: true });
    if (table === "ip_whitelist") return Response.json([{ ip_address: "127.0.0.1" }]);
    if (table === "geo_allowed_countries") return Response.json([{ country_code: "BR" }]);
    if (table === "access_blocked_log") { logs++; return denied(); }
    throw new Error(`Consulta inesperada: ${table}`);
  }, async submit => {
    for (const [body, reason] of [[{ ip: "203.0.113.1" }, "ip_blocked"], [{ country: "FR" }, "geo_blocked"]] as const) {
      const response = await submit(body, { Authorization: "Bearer sessao-teste" });
      assertEquals(response.status, 200);
      const result = await response.json();
      assertEquals(result.allowed, false);
      assertEquals(result.reason, reason);
    }
    assertEquals(logs, 2);
  });
});

Deno.test("insights com JSON inválido mantêm fallback e narrowing do erro de parse", async () => {
  await withHandler("generate-insights", () => new Response(null, { status: 204 }), async submit => {
    const response = await submit({}, { Authorization: "Bearer sessao-teste" });
    assertEquals(response.status, 200);
    assertEquals((await response.json()).insights, []);
  }, true);
});

Deno.test("revalidação usa os dois mapas de verificação e preserva proprietário na fila", async () => {
  const queued: unknown[] = [];
  await withHandler("bulk-revalidate", async req => {
    const url = new URL(req.url);
    const table = url.pathname.split("/").pop()!;
    if (table === "contacts") {
      assertEquals(url.searchParams.get("user_id"), `eq.${owner}`);
      return Response.json([{ id: contact, email: "maria@example.test", phone: "+5511999999999" }]);
    }
    if (table === "email_verifications") return Response.json([{ contact_id: contact, status: "invalid", verified_at: "2000-01-01" }]);
    if (table === "phone_validations") return Response.json([{ contact_id: contact, status: "invalid", validated_at: "2000-01-01" }]);
    if (table === "validation_queue") { queued.push(await req.json()); return new Response(null, { status: 204 }); }
    throw new Error(`Consulta inesperada: ${table}`);
  }, async submit => {
    const response = await submit({ kind: "both", statuses: ["invalid"], olderThanDays: 1, limit: 5 },
      { Authorization: "Bearer sessao-teste" });
    assertEquals(response.status, 200);
    assertEquals((await response.json()).enqueued, 2);
    assertEquals(queued, [[
      { user_id: owner, contact_id: contact, kind: "email", value: "maria@example.test", status: "pending", attempts: 0 },
      { user_id: owner, contact_id: contact, kind: "phone", value: "+5511999999999", status: "pending", attempts: 0 },
    ]]);
  });
});

Deno.test("error budget persiste os três limiares uma única vez", async () => {
  const alerts = new Map<string, Record<string, unknown>>();
  let alertWrites = 0;
  await withHandler("error-budget", async req => {
    const url = new URL(req.url);
    if (url.pathname.endsWith("system_health_snapshots")) {
      return Response.json(Array.from({ length: 50 }, () => ({ timestamp: new Date().toISOString(), status: "unhealthy" })));
    }
    if (req.method === "POST") {
      alertWrites++;
      const body = await req.json();
      alerts.set(body.alert_type, body);
      return new Response(null, { status: 201 });
    }
    const type = url.searchParams.get("alert_type")?.replace("eq.", "");
    return Response.json(type ? (alerts.has(type) ? [{ id: type }] : []) : []);
  }, async submit => {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await submit({}, { Authorization: "Bearer sessao-teste" });
      assertEquals(response.status, 200);
      assertEquals((await response.json()).freeze_active, true);
    }
    assertEquals([...alerts.keys()], ["error_budget_50", "error_budget_75", "error_budget_100"]);
    assertEquals(alertWrites, 3);
    assertEquals([...alerts.values()].map(alert => alert.threshold_pct), [50, 75, 100]);
  });
});

Deno.test("nurturing aguarda builders e RPC mesmo com falhas best-effort", async () => {
  const writes: string[] = [];
  await withHandler("nurturing-runner", req => {
    const table = new URL(req.url).pathname.split("/").pop()!;
    if (req.method === "GET" && table === "nurturing_executions") return Response.json([
      { id: "exec-tarefa", user_id: owner, contact_id: contact, workflow_id: "tarefa", current_step: 0 },
      { id: "exec-interacao", user_id: owner, contact_id: contact, workflow_id: "interacao", current_step: 0 },
      { id: "exec-concluida", user_id: owner, contact_id: contact, workflow_id: "concluida", current_step: 0 },
    ]);
    if (req.method === "GET") return Response.json([
      { id: "tarefa", steps: [{ type: "task" }] }, { id: "interacao", steps: [{ type: "email" }] }, { id: "concluida", steps: [] },
    ]);
    writes.push(table);
    return table === "nurturing_executions" ? new Response(null, { status: 204 }) : denied();
  }, async submit => {
    const response = await submit({}, { "x-cron-secret": "cron-teste" });
    assertEquals(response.status, 200);
    assertEquals((await response.json()).stats, { processed: 3, advanced: 2, completed: 1, failed: 0 });
    assertEquals(writes.filter(table => ["tasks", "interactions", "increment_workflow_completed"].includes(table)).sort(),
      ["increment_workflow_completed", "interactions", "tasks"]);
  });
});
