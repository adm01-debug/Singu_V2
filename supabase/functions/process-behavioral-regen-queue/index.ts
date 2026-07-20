import { createClient } from 'npm:@supabase/supabase-js@2';
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";


interface QueueRow {
  contact_id: string;
  user_id: string;
  attempts: number;
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const batchSize = 10;

  // Atomically claim a batch: pushes next_run_at forward (15-min lock) with
  // FOR UPDATE SKIP LOCKED, preventing double-processing on concurrent cron invocations.
  const { data: due, error: readErr } = await admin
    .rpc('claim_regen_batch', { p_batch_size: batchSize, p_lock_minutes: 15 });

  if (readErr) {
    console.error("process-behavioral-regen-queue fetch error:", readErr);
    return json({ error: "Internal server error" }, 500, cors);
  }

  const items = (due ?? []) as QueueRow[];
  const results: Array<{ contact_id: string; ok: boolean; error?: string }> = [];

  const toDelete: string[] = [];
  const toUpdate: Array<{
    contact_id: string;
    attempts: number;
    last_error: string;
    last_processed_at: string;
    next_run_at: string;
  }> = [];

  for (const item of items) {
    try {
      const resp = await fetchAPI(`${SUPABASE_URL}/functions/v1/generate-behavioral-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
        },
        body: JSON.stringify({ contact_id: item.contact_id, user_id: item.user_id }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        // 422 = sem histórico ainda; remove da fila para não reprocessar em loop
        if (resp.status === 422) {
          toDelete.push(item.contact_id);
          results.push({ contact_id: item.contact_id, ok: false, error: 'sem histórico' });
          continue;
        }
        throw new Error(`[${resp.status}] ${txt.slice(0, 200)}`);
      }

      toDelete.push(item.contact_id);
      results.push({ contact_id: item.contact_id, ok: true });
    } catch (e) {
      const msg = (e as Error).message;
      const nextAttempts = item.attempts + 1;
      const backoffMin = Math.min(60, 5 * Math.pow(2, item.attempts));
      toUpdate.push({
        contact_id: item.contact_id,
        attempts: nextAttempts,
        last_error: msg.slice(0, 500),
        last_processed_at: new Date().toISOString(),
        next_run_at: new Date(Date.now() + backoffMin * 60_000).toISOString(),
      });
      results.push({ contact_id: item.contact_id, ok: false, error: msg });
    }
  }

  // Batch all DB writes after the loop
  await Promise.all([
    toDelete.length > 0
      ? admin.from('behavioral_profile_regen_queue').delete().in('contact_id', toDelete)
      : Promise.resolve(),
    toUpdate.length > 0
      ? admin.from('behavioral_profile_regen_queue').upsert(toUpdate, { onConflict: 'contact_id' })
      : Promise.resolve(),
  ]);

  return json({ processed: items.length, results }, 200, cors);
});

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}