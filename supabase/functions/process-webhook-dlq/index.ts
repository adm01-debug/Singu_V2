import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";


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

  const cronCheck = requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let manualId: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (typeof body?.id === "string") manualId = body.id;
    } catch { /* ignore */ }
  }

  const query = admin.from("incoming_webhook_dlq")
    .select("id, webhook_id, payload, attempts, max_attempts")
    .eq("status", "pending");

  const { data: pending, error } = manualId
    ? await query.eq("id", manualId).limit(1)
    : await query.lte("next_retry_at", new Date().toISOString()).limit(20);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const rows = (pending ?? []) as DlqRow[];
  const results: { id: string; status: string; error?: string }[] = [];

  for (const row of rows) {
    await admin.from("incoming_webhook_dlq")
      .update({ status: "processing" }).eq("id", row.id);

    const { data: webhook } = await admin.from("incoming_webhooks")
      .select("target_entity, created_by, field_mapping, is_active")
      .eq("id", row.webhook_id).maybeSingle();

    if (!webhook || !webhook.is_active) {
      await admin.from("incoming_webhook_dlq").update({
        status: "abandoned",
        last_error: "Webhook removido ou inativo",
        resolved_at: new Date().toISOString(),
      }).eq("id", row.id);
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
      if (insErr) errMsg = insErr.message; else succeeded = true;
    } else {
      succeeded = true;
    }

    const newAttempts = row.attempts + 1;
    if (succeeded) {
      await admin.from("incoming_webhook_dlq").update({
        status: "succeeded", attempts: newAttempts,
        resolved_at: new Date().toISOString(), last_error: null,
      }).eq("id", row.id);
      results.push({ id: row.id, status: "succeeded" });
    } else if (newAttempts >= row.max_attempts) {
      await admin.from("incoming_webhook_dlq").update({
        status: "failed", attempts: newAttempts, last_error: errMsg,
        resolved_at: new Date().toISOString(),
      }).eq("id", row.id);
      results.push({ id: row.id, status: "failed", error: errMsg ?? undefined });
    } else {
      // Backoff exponencial: 2^attempts minutos (2, 4, 8, 16, 32 min)
      const delayMin = Math.pow(2, newAttempts);
      const nextRetry = new Date(Date.now() + delayMin * 60_000).toISOString();
      await admin.from("incoming_webhook_dlq").update({
        status: "pending", attempts: newAttempts, last_error: errMsg,
        next_retry_at: nextRetry,
      }).eq("id", row.id);
      results.push({ id: row.id, status: "retry_scheduled", error: errMsg ?? undefined });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200, headers: { ...cors, "Content-Type": "application/json" },
  });
});
