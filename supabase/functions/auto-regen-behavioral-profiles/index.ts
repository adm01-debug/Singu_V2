// Cron job: reanalisa perfis comportamentais de contatos com 3+ reprovações
// SLA: não reprocessa o mesmo contato mais de 1x a cada 24h
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";


const SLA_HOURS = 24;
const MIN_DOWNVOTES = 3;
const MAX_BATCH = 25; // limita por execução para evitar timeout

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Buscar contatos elegíveis (>=3 downvotes)
    const sinceIso = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: feedback, error: feedbackError } = await admin
      .from("behavioral_insight_feedback")
      .select("contact_id, user_id, vote, created_at")
      .eq("vote", -1)
      .gte("created_at", sinceIso);

    if (feedbackError) throw feedbackError;

    const tally = new Map<string, { count: number; userId: string; last: string }>();
    for (const row of feedback ?? []) {
      if (!row.contact_id) continue;
      const key = row.contact_id as string;
      const existing = tally.get(key);
      if (existing) {
        existing.count += 1;
        if (row.created_at > existing.last) existing.last = row.created_at;
      } else {
        tally.set(key, {
          count: 1,
          userId: row.user_id as string,
          last: row.created_at as string,
        });
      }
    }

    const eligible = Array.from(tally.entries())
      .filter(([, v]) => v.count >= MIN_DOWNVOTES)
      .map(([contactId, v]) => ({ contactId, ...v }));

    if (eligible.length === 0) {
      return json({ requestId, processed: 0, skipped: 0, message: "nenhum contato elegível" });
    }

    // 2. Filtrar por SLA — single query fetches both last_processed_at and attempts
    const contactIds = eligible.map((e) => e.contactId);
    const { data: queueData, error: queueError } = await admin
      .from("behavioral_profile_regen_queue")
      .select("contact_id, last_processed_at, attempts")
      .in("contact_id", contactIds);

    if (queueError) throw queueError;

    const slaCutoff = Date.now() - SLA_HOURS * 3600 * 1000;
    const recentMap = new Map(
      (queueData ?? []).map((r) => [r.contact_id as string, r.last_processed_at as string | null]),
    );
    // Derived from the same single query — no second round-trip needed
    const attemptsMap = new Map<string, number>(
      (queueData ?? []).map((r: { contact_id: string; attempts: number | null }) => [
        r.contact_id as string,
        r.attempts ?? 0,
      ]),
    );

    const toProcess = eligible
      .filter((e) => {
        const last = recentMap.get(e.contactId);
        if (!last) return true;
        return new Date(last).getTime() < slaCutoff;
      })
      .slice(0, MAX_BATCH);

    let processed = 0;
    const failures: Array<{ contactId: string; error: string }> = [];

    // Batch-upsert all items to mark as queued before invoking
    const nowIso = new Date().toISOString();
    const queueRows = toProcess.map((item) => ({
      contact_id: item.contactId,
      user_id: item.userId,
      enqueued_at: nowIso,
      next_run_at: nowIso,
      trigger_source: "cron_auto_regen_downvotes",
    }));
    const { error: batchQueueError, data: batchQueueData } = await admin
      .from("behavioral_profile_regen_queue")
      .upsert(queueRows, { onConflict: "contact_id" })
      .select("contact_id");

    const enqueuedSet = new Set(
      (batchQueueData ?? []).map((r: { contact_id: string }) => r.contact_id)
    );
    if (batchQueueError) {
      // If batch fails entirely, fall back to per-item failure recording
      failures.push(...toProcess.map((item) => ({ contactId: item.contactId, error: batchQueueError.message })));
    }

    // Accumulators for success/failure outcome updates
    type OutcomeRow = { contact_id: string; last_processed_at: string; last_error: string | null; attempts?: number };
    const successRows: OutcomeRow[] = [];
    const failureRows: OutcomeRow[] = [];

    for (const item of toProcess) {
      // Skip items that failed to enqueue
      if (batchQueueError && !enqueuedSet.has(item.contactId)) continue;

      try {
        const { error: invokeError } = await admin.functions.invoke(
          "generate-behavioral-profile",
          {
            body: { contact_id: item.contactId, trigger: "auto_regen_sla" },
            headers: {
              "x-internal-key": serviceKey,
              "x-cron-secret": Deno.env.get("CRON_SECRET") ?? "",
            },
          },
        );
        if (invokeError) throw invokeError;
        processed += 1;
        successRows.push({ contact_id: item.contactId, last_processed_at: new Date().toISOString(), last_error: null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failures.push({ contactId: item.contactId, error: msg });
        const prevAttempts = attemptsMap.get(item.contactId) ?? 0;
        failureRows.push({
          contact_id: item.contactId,
          last_error: msg.slice(0, 500),
          attempts: prevAttempts + 1,
          last_processed_at: new Date().toISOString(),
        });
      }

      // pequena pausa para não saturar edge function
      await new Promise((r) => setTimeout(r, 500));
    }

    // Flush all outcome updates in two batched upserts
    await Promise.all([
      successRows.length > 0
        ? admin.from("behavioral_profile_regen_queue").upsert(successRows, { onConflict: "contact_id" })
        : Promise.resolve(),
      failureRows.length > 0
        ? admin.from("behavioral_profile_regen_queue").upsert(failureRows, { onConflict: "contact_id" })
        : Promise.resolve(),
    ]);

    return json({
      requestId,
      eligible: eligible.length,
      processed,
      skipped: eligible.length - toProcess.length,
      failures,
      elapsedMs: Date.now() - startedAt,
      alert: await maybeRaiseErrorRateAlert(admin, requestId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auto-regen-behavioral-profiles]", requestId, message);
    return json({ requestId, error: message }, 500);
  }
});

const ERROR_RATE_THRESHOLD = 10; // percentual
const MIN_SAMPLE = 5; // ignora janelas com pouquíssimas execuções para evitar falso positivo

async function maybeRaiseErrorRateAlert(admin: SupabaseClient, requestId: string) {
  try {
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    // Fetch recent runs and open alert in parallel — both queries are independent
    const [{ data: recentRuns, error: runsError }, { data: existing }] = await Promise.all([
      admin
        .from("behavioral_profile_regen_queue")
        .select("last_error, last_processed_at, trigger_source")
        .gte("last_processed_at", sinceIso),
      admin
        .from("system_alerts")
        .select("id")
        .eq("alert_type", "behavioral_regen_error_rate")
        .is("acknowledged_at", null)
        .gte("created_at", sinceIso)
        .limit(1),
    ]);
    if (runsError) throw runsError;

    const rows = recentRuns ?? [];
    const total = rows.length;
    if (total < MIN_SAMPLE) return { raised: false, reason: "sample_too_small", total };

    const errors = rows.filter((r: { last_error: string | null }) => Boolean(r.last_error)).length;
    const rate = (errors / total) * 100;
    if (rate <= ERROR_RATE_THRESHOLD) {
      return { raised: false, rate, total };
    }

    // Deduplicação: se já existe alerta não reconhecido da mesma categoria na última hora, não duplica

    if (existing && existing.length > 0) {
      return { raised: false, rate, total, reason: "already_open", existing: existing[0].id };
    }

    const { data: inserted, error: insertError } = await admin
      .from("system_alerts")
      .insert({
        alert_type: "behavioral_regen_error_rate",
        severity: rate >= 30 ? "critical" : "warning",
        threshold_pct: ERROR_RATE_THRESHOLD,
        consumed_pct: Number(rate.toFixed(2)),
        message: `Taxa de erro do cron de reanálise em ${rate.toFixed(1)}% na última hora (${errors}/${total} execuções falharam)`,
        metadata: {
          request_id: requestId,
          window_hours: 1,
          total_runs: total,
          failed_runs: errors,
          source: "auto-regen-behavioral-profiles",
        },
      })
      .select("id")
      .single();
    if (insertError) throw insertError;

    console.warn(
      "[auto-regen-behavioral-profiles] alert raised",
      requestId,
      { rate, errors, total, alertId: inserted?.id },
    );
    return { raised: true, rate, total, errors, alertId: inserted?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[auto-regen-behavioral-profiles] alert check failed", requestId, msg);
    return { raised: false, error: msg };
  }
}