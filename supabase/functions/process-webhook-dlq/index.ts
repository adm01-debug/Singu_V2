import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret, guardBody } from "../_shared/auth.ts";


interface DlqRow {
  id: string;
  webhook_id: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
}

const TABLE_MAP: Record<string, string> = {
  contact: "contacts", company: "companies", deal: "deals",
  interaction: "interactions", note: "notes",
};

/**
 * Reprocessa entradas pendentes da DLQ com backoff exponencial (2^n minutos).
 * Cron: a cada 5 minutos. Aceita também trigger manual via POST { id }.
 */
Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const { body: rawBody } = await guardBody(req, 32 * 1024);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let manualId: string | null = null;
  if (req.method === "POST") {
    const body = rawBody as Record<string, unknown> | null;
    if (typeof body?.id === "string") manualId = body.id;
  }

  const query = admin.from("incoming_webhook_dlq")
    .select("id, webhook_id, payload, attempts, max_attempts")
    .eq("status", "pending");

  const { data: pending, error } = manualId
    ? await query.eq("id", manualId).limit(1)
    : await query.lte("next_retry_at", new Date().toISOString()).limit(20);

  if (error) {
    console.error("process-webhook-dlq query error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const rows = (pending ?? []) as DlqRow[];
  const results: { id: string; status: string }[] = [];

  if (rows.length === 0) {
    return new Response(JSON.stringify({ processed: 0, results: [] }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const rowIds = rows.map(r => r.id);
  const resolvedAt = new Date().toISOString();

  // Batch-mark all as "processing" and pre-fetch all webhooks in parallel
  const uniqueWebhookIds = [...new Set(rows.map(r => r.webhook_id))];
  const [, webhookResult] = await Promise.all([
    admin.from("incoming_webhook_dlq").update({ status: "processing" }).in("id", rowIds),
    admin.from("incoming_webhooks")
      .select("id, target_entity, created_by, field_mapping, is_active")
      .in("id", uniqueWebhookIds),
  ]);

  const webhookMap = new Map(
    (webhookResult.data ?? []).map((w: { id: string }) => [w.id, w])
  );

  // Outcome accumulators (different data per row → upsert arrays)
  type DlqUpdate = Record<string, unknown>;
  const abandonedRows: DlqUpdate[] = [];
  const succeededRows: DlqUpdate[] = [];
  const failedRows: DlqUpdate[] = [];
  const retryRows: DlqUpdate[] = [];

  for (const row of rows) {
    const webhook = webhookMap.get(row.webhook_id) as (typeof webhookResult.data extends Array<infer T> ? T : never) | undefined;

    if (!webhook || !webhook.is_active) {
      abandonedRows.push({ id: row.id, status: "abandoned", last_error: "Webhook removido ou inativo", resolved_at: resolvedAt });
      results.push({ id: row.id, status: "abandoned" });
      continue;
    }

    const mapping = (webhook.field_mapping ?? {}) as Record<string, string>;
    const mapped: Record<string, unknown> = {};
    for (const [target, path] of Object.entries(mapping)) {
      let v: unknown = row.payload;
      for (const p of path.split(".")) v = (v as Record<string, unknown> | null)?.[p];
      if (v !== undefined) mapped[target] = v;
    }
    const finalRow = Object.keys(mapped).length ? mapped : row.payload;
    const targetTable = TABLE_MAP[webhook.target_entity];

    let succeeded = false;
    let errMsg: string | null = null;

    if (targetTable) {
      const { error: insErr } = await admin.from(targetTable)
        .insert({ ...finalRow, user_id: webhook.created_by });
      if (insErr) { console.error("process-webhook-dlq insert error:", insErr); errMsg = insErr.message; } else succeeded = true;
    } else {
      succeeded = true;
    }

    const newAttempts = row.attempts + 1;
    if (succeeded) {
      succeededRows.push({ id: row.id, status: "succeeded", attempts: newAttempts, resolved_at: resolvedAt, last_error: null });
      results.push({ id: row.id, status: "succeeded" });
    } else if (newAttempts >= row.max_attempts) {
      failedRows.push({ id: row.id, status: "failed", attempts: newAttempts, last_error: errMsg, resolved_at: resolvedAt });
      results.push({ id: row.id, status: "failed" });
    } else {
      // Backoff exponencial: 2^attempts minutos (2, 4, 8, 16, 32 min)
      const nextRetry = new Date(Date.now() + Math.pow(2, newAttempts) * 60_000).toISOString();
      retryRows.push({ id: row.id, status: "pending", attempts: newAttempts, last_error: errMsg, next_retry_at: nextRetry });
      results.push({ id: row.id, status: "retry_scheduled" });
    }
  }

  // Flush all outcome updates in parallel
  await Promise.all([
    abandonedRows.length > 0 ? admin.from("incoming_webhook_dlq").upsert(abandonedRows, { onConflict: "id" }) : Promise.resolve(),
    succeededRows.length > 0 ? admin.from("incoming_webhook_dlq").upsert(succeededRows, { onConflict: "id" }) : Promise.resolve(),
    failedRows.length > 0 ? admin.from("incoming_webhook_dlq").upsert(failedRows, { onConflict: "id" }) : Promise.resolve(),
    retryRows.length > 0 ? admin.from("incoming_webhook_dlq").upsert(retryRows, { onConflict: "id" }) : Promise.resolve(),
  ]);

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200, headers: { ...cors, "Content-Type": "application/json" },
  });
});
