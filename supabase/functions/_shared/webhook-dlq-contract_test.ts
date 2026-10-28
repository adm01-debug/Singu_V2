import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { withHandler } from "./edge-test-harness.ts";

const auth = { "x-cron-secret": "cron-teste" };
const owner = "11111111-1111-4111-8111-111111111111";
type Row = Record<string, unknown>;
type Failure = "query" | "webhooks" | "claim" | "outcome" | "outcome-empty" | "insert" | "claim-empty";

function fixture(options: { target?: string; attempts?: number; inactive?: boolean; empty?: boolean; failure?: Failure; concurrent?: boolean } = {}) {
  const row: Row = {
    id: "fila-1", webhook_id: "webhook-1", payload: { name: "Contato", user_id: "outro-dono" },
    attempts: options.attempts ?? 0, max_attempts: 2, status: "pending", resolved_at: null,
  };
  const writes: Row[] = [];
  const methods: string[] = [];
  let queries = 0;
  let arrived = 0;
  let release: () => void = () => {};
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const backend = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const table = url.pathname.split("/").pop();
    const fail = () => Response.json({ code: "XX000", message: "Falha simulada" }, { status: 400 });
    if (req.method === "GET" && table === "incoming_webhook_dlq") {
      queries++;
      if (options.failure === "query") return fail();
      const selected = options.empty ? [] : [structuredClone(row)];
      if (options.concurrent) {
        if (++arrived === 2) release();
        await barrier;
      }
      return Response.json(selected);
    }
    if (req.method === "GET" && table === "incoming_webhooks") {
      if (options.failure === "webhooks") return fail();
      return Response.json([{ id: "webhook-1", target_entity: options.target ?? "contact", created_by: owner,
        is_active: !options.inactive, field_mapping: { first_name: "name", user_id: "user_id" } }]);
    }
    const body = await req.json();
    if (table === "incoming_webhook_dlq") {
      methods.push(req.method);
      if (!Array.isArray(body) && body.status === "processing") {
        if (options.failure === "claim") return fail();
        if (options.failure === "claim-empty") return Response.json([]);
        if (url.searchParams.get("status") === "eq.pending" && row.status !== "pending") return Response.json([]);
        Object.assign(row, body);
        return Response.json([{ id: row.id }]);
      }
      if (options.failure === "outcome") return fail();
      if (options.failure === "outcome-empty") return Response.json([]);
      Object.assign(row, Array.isArray(body) ? body[0] : body);
      return Response.json([{ id: row.id }]);
    }
    assertEquals(["contacts", "companies", "deals", "interactions", "notes"].includes(table!), true);
    assertEquals(req.method, "POST");
    if (options.failure === "insert") return fail();
    writes.push(...(Array.isArray(body) ? body : [body]));
    return new Response(null, { status: 201 });
  };
  return { row, writes, methods, backend, queries: () => queries };
}

Deno.test("DLQ rejeita entidade desconhecida sem inventar sucesso nem inserir no destino", async () => {
  for (const target of ["desconhecida", "custom", "toString", "__proto__"]) {
    const f = fixture({ target });
    await withHandler("process-webhook-dlq", f.backend, async submit => {
      const response = await submit({}, auth);
      assertEquals(response.status, 200);
      assertEquals(await response.json(), { processed: 1, results: [{ id: "fila-1", status: "failed" }] });
      assertEquals(f.row.status, "failed");
      assertEquals(typeof f.row.last_error, "string");
      assertEquals(f.writes.length, 0);
    });
  }
});

for (const failure of ["outcome", "outcome-empty"] as const) {
  Deno.test(`DLQ não confirma sucesso quando a persistência retorna ${failure}`, async () => {
    const f = fixture({ failure });
    await withHandler("process-webhook-dlq", f.backend, async submit => {
      const response = await submit({}, auth);
      assertEquals(response.status, 500);
      assertEquals(typeof (await response.json()).error, "string");
      assertEquals(f.writes.length, 1);
      assertEquals(f.row.status, "processing");
      assertEquals(f.row.attempts, 0);
      assertEquals(f.row.resolved_at, null);
    });
  });
}

for (const failure of ["query", "webhooks", "claim"] as const) {
  Deno.test(`DLQ interrompe o processamento antes do efeito quando falha ${failure}`, async () => {
    const f = fixture({ failure });
    await withHandler("process-webhook-dlq", f.backend, async submit => {
      const response = await submit({}, auth);
      assertEquals(response.status, 500);
      await response.body?.cancel();
      assertEquals(f.writes.length, 0);
      assertEquals(f.row.status, "pending");
    });
  });
}

Deno.test("DLQ só processa registros cuja reserva foi confirmada", async () => {
  const f = fixture({ failure: "claim-empty" });
  await withHandler("process-webhook-dlq", f.backend, async submit => {
    const response = await submit({}, auth);
    assertEquals(response.status, 200);
    assertEquals(await response.json(), { processed: 0, results: [] });
    assertEquals(f.writes.length, 0);
  });
});

Deno.test("DLQ confirma cada destino válido com dono e mapeamento sem upsert parcial", async () => {
  for (const target of ["contact", "company", "deal", "interaction", "note"]) {
    const f = fixture({ target });
    await withHandler("process-webhook-dlq", f.backend, async submit => {
      const response = await submit({ id: "fila-1" }, auth);
      assertEquals(response.status, 200);
      assertEquals(await response.json(), { processed: 1, results: [{ id: "fila-1", status: "succeeded" }] });
      assertEquals(f.writes, [{ first_name: "Contato", user_id: owner }]);
      assertEquals(f.row.status, "succeeded");
      assertEquals(f.row.attempts, 1);
      assertEquals(f.row.last_error, null);
      assertEquals(typeof f.row.resolved_at, "string");
      assertEquals(f.methods, ["PATCH", "PATCH"]);
    });
  }
});

Deno.test("DLQ preserva backoff exponencial e encerra ao atingir max_attempts", async () => {
  for (const attempts of [0, 1]) {
    const f = fixture({ failure: "insert", attempts });
    await withHandler("process-webhook-dlq", f.backend, async submit => {
      const before = Date.now();
      const response = await submit({}, auth);
      assertEquals(response.status, 200);
      assertEquals(await response.json(), { processed: 1, results: [{ id: "fila-1", status: attempts ? "failed" : "retry_scheduled" }] });
      assertEquals(f.row.status, attempts ? "failed" : "pending");
      assertEquals(f.row.attempts, attempts + 1);
      assertEquals(f.writes.length, 0);
      if (!attempts) {
        const retry = Date.parse(String(f.row.next_retry_at));
        assertEquals(retry >= before + 120_000 && retry <= Date.now() + 120_000, true);
        assertEquals(f.row.resolved_at, null);
      }
    });
  }
});

Deno.test("DLQ abandona webhook inativo sem inserir e não altera fila vazia", async () => {
  for (const empty of [false, true]) {
    const f = fixture({ inactive: true, empty });
    await withHandler("process-webhook-dlq", f.backend, async submit => {
      const response = await submit({}, auth);
      assertEquals(response.status, 200);
      assertEquals(await response.json(), { processed: empty ? 0 : 1, results: empty ? [] : [{ id: "fila-1", status: "abandoned" }] });
      assertEquals(f.row.status, empty ? "pending" : "abandoned");
      assertEquals(f.writes.length, 0);
      assertEquals(f.methods.includes("POST"), false);
    });
  }
});

Deno.test("DLQ reserva o registro uma única vez em duas requisições concorrentes", async () => {
  const f = fixture({ concurrent: true });
  await withHandler("process-webhook-dlq", f.backend, async submit => {
    const responses = await Promise.all([submit({}, auth), submit({}, auth)]);
    assertEquals(responses.map(r => r.status), [200, 200]);
    const results = await Promise.all(responses.map(r => r.json()));
    assertEquals(results.map(r => r.processed).sort(), [0, 1]);
    assertEquals(f.writes.length, 1);
    assertEquals(f.row.status, "succeeded");
  });
});

Deno.test("DLQ recusa id inválido e credencial incorreta sem consultar registros", async () => {
  const f = fixture();
  await withHandler("process-webhook-dlq", f.backend, async submit => {
    for (const [body, headers, status] of [[{ id: 123 }, auth, 400], [{}, { "x-cron-secret": "incorreto" }, 401]] as const) {
      const response = await submit(body, headers);
      assertEquals(response.status, status);
      await response.body?.cancel();
    }
    assertEquals(f.queries(), 0);
    assertEquals(f.methods.length, 0);
    assertEquals(f.writes.length, 0);
  });
});
