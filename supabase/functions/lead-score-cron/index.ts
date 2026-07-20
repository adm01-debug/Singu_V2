// Lead Score Cron — varre todos os contatos com atividade recente e recalcula.
// Aciona-se via cron (header x-cron-secret) ou manualmente por admin.
import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, jsonError, jsonOk, requireCronSecret } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: scopedCorsHeaders(req) });
  if (req.method !== 'POST') return jsonError('Method not allowed', 405, req);

  const guard = await requireCronSecret(req);
  if (guard) return guard;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Contatos com qualquer atividade nos últimos 60d → enfileira
    const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
    const { data: actives, error: fetchError } = await supabase
      .from('interactions').select('contact_id, user_id')
      .gte('created_at', since).limit(5000);

    if (fetchError) throw fetchError;

    const seen = new Set<string>();
    const rows: Array<{ user_id: string; contact_id: string; reason: string }> = [];
    for (const a of actives ?? []) {
      const k = `${a.user_id}:${a.contact_id}`;
      if (seen.has(k) || !a.contact_id) continue;
      seen.add(k);
      rows.push({ user_id: a.user_id as string, contact_id: a.contact_id as string, reason: 'cron_daily' });
    }

    if (rows.length > 0) {
      const chunks: typeof rows[] = [];
      for (let i = 0; i < rows.length; i += 500) chunks.push(rows.slice(i, i + 500));
      const chunkResults = await Promise.all(
        chunks.map((chunk) => supabase.from('lead_score_recompute_queue').insert(chunk)),
      );
      const insertError = chunkResults.find((r) => r.error)?.error;
      if (insertError) throw insertError;
    }

    return jsonOk({ ok: true, enqueued: rows.length }, req);
  } catch (err) {
    console.error('lead-score-cron error:', err);
    return jsonError("Internal server error", 500, req);
  }
});
