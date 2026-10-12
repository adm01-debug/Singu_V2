import { createClient } from 'npm:@supabase/supabase-js@2';
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";


interface QueueRow {
  contact_id: string;
  user_id: string;
  attempts: number;
  claim_token: string;
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

  // All items are independent — fire concurrently, not sequentially
  const settled = await Promise.allSettled(
    items.map((item) =>
      fetchAPI(`${SUPABASE_URL}/functions/v1/generate-behavioral-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'apikey': SERVICE_KEY,
          'x-cron-secret': Deno.env.get('CRON_SECRET') ?? '',
        },
        body: JSON.stringify({ contact_id: item.contact_id, user_id: item.user_id }),
      }).then(async (resp) => {
        if (!resp.ok) {
          const txt = await resp.text();
          if (resp.status === 422) return { status: 422 as const };
          throw new Error(`[${resp.status}] ${txt.slice(0, 200)}`);
        }
        return { status: 200 as const };
      })
    )
  );

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const outcome = settled[i];
    if (outcome.status === 'fulfilled') {
      results.push({
        contact_id: item.contact_id,
        ok: outcome.value.status === 200,
        ...(outcome.value.status === 422 ? { error: 'sem histórico' } : {}),
      });
    } else {
      const msg = (outcome.reason as Error).message;
      results.push({ contact_id: item.contact_id, ok: false, error: msg });
    }
  }

  const writes = await Promise.all(items.map((item, index) => {
    const outcome = settled[index];
    const row = admin.from('behavioral_profile_regen_queue');
    if (outcome.status === 'fulfilled') {
      return row.delete().eq('contact_id', item.contact_id).eq('claim_token', item.claim_token).select('contact_id').maybeSingle();
    }
    const backoffMin = Math.min(60, 5 * Math.pow(2, item.attempts - 1));
    return row.update({
      last_error: String(outcome.reason).slice(0, 500),
      next_run_at: new Date(Date.now() + backoffMin * 60_000).toISOString(),
    }).eq('contact_id', item.contact_id).eq('claim_token', item.claim_token).select('contact_id').maybeSingle();
  }));
  if (writes.some((write) => write.error)) {
    return json({ error: 'Não foi possível confirmar todos os itens da fila', results }, 503, cors);
  }
  writes.forEach((write, index) => {
    if (!write.data) results[index] = { contact_id: items[index].contact_id, ok: false, error: 'Reserva substituída por uma nova solicitação' };
  });

  return json({ processed: writes.filter((write) => write.data).length, results }, 200, cors);
});

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}