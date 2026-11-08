import { createClient } from 'npm:@supabase/supabase-js@2';
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";


/**
 * Job periódico que reanalisa perfis comportamentais de contatos que acumularam
 * feedback negativo suficiente desde a última geração.
 *
 * SLA / regras:
 *  - Threshold: DOWN_THRESHOLD downvotes acumulados por contato.
 *  - Só reanalisa se o feedback mais recente for POSTERIOR à `last_updated_at` do
 *    perfil (evita loop quando já reanalisamos e o usuário ainda não avaliou de novo).
 *  - Debounce: ignora contatos reanalisados há menos de MIN_INTERVAL_MIN minutos.
 *  - Limite: BATCH_SIZE contatos por execução (protege budget de IA).
 *  - Rate limit: DELAY_MS entre chamadas à edge function `generate-behavioral-profile`.
 *
 * Segurança:
 *  - Autenticação via `x-cron-key` (compartilhado com pg_cron) OU service role.
 *  - Não retorna dados de contato — apenas contagens agregadas.
 */

const DOWN_THRESHOLD = 3;
const BATCH_SIZE = 20;
const MIN_INTERVAL_MIN = 30;
const DELAY_MS = 800;

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Capture cors for the json() helper defined at module scope
  const jsonWithCors = (body: unknown, status = 200) => json(body, status, cors);

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  try {
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    if (!SERVICE_KEY || !SUPABASE_URL) return jsonWithCors({ error: 'Configuração ausente' }, 500);

    // Autorização: service role no header interno OU chave de cron
    const cronKey = req.headers.get('x-cron-key') ?? '';
    const internalKey = req.headers.get('x-internal-key') ?? '';
    let authorized = internalKey === SERVICE_KEY;

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    if (!authorized && cronKey) {
      const { data: sec } = await supabase
        .from('cron_secrets')
        .select('value')
        .eq('name', 'behavioral_rebatch')
        .maybeSingle();
      const expected = (sec as { value?: string } | null)?.value;
      if (expected && cronKey === expected) authorized = true;
    }
    if (!authorized) return jsonWithCors({ error: 'Não autorizado' }, 401);

    // 1) Buscar feedback negativo dos últimos 30 dias
    const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: fbRows, error: fbErr } = await supabase
      .from('behavioral_insight_feedback')
      .select('contact_id, user_id, vote, created_at')
      .gte('created_at', cutoff)
      .eq('vote', -1);
    if (fbErr) { console.error("auto-rebatch-behavioral feedback read error:", fbErr); return jsonWithCors({ error: "Internal server error" }, 500); }

    // 2) Agregar por contato: contagem + último feedback negativo
    interface Agg { down: number; lastFb: string; userId: string }
    const agg = new Map<string, Agg>();
    for (const r of (fbRows ?? []) as Array<{ contact_id: string; user_id: string; created_at: string }>) {
      const cur = agg.get(r.contact_id) ?? { down: 0, lastFb: r.created_at, userId: r.user_id };
      cur.down += 1;
      if (r.created_at > cur.lastFb) cur.lastFb = r.created_at;
      agg.set(r.contact_id, cur);
    }

    // 3) Filtrar candidatos que atingem o threshold
    const candidates = Array.from(agg.entries())
      .filter(([, v]) => v.down >= DOWN_THRESHOLD)
      .map(([contact_id, v]) => ({ contact_id, ...v }));

    if (candidates.length === 0) {
      return jsonWithCors({ ok: true, considered: 0, eligible: 0, processed: 0, skipped: 0, failed: 0 });
    }

    // 4) Carregar perfis existentes para aplicar SLA/debounce
    const contactIds = candidates.map((c) => c.contact_id);
    const { data: profiles, error: profErr } = await supabase
      .from('contact_analytical_profiles')
      .select('contact_id, last_updated_at')
      .in('contact_id', contactIds);
    if (profErr) { console.error("auto-rebatch-behavioral profiles read error:", profErr); return jsonWithCors({ error: "Internal server error" }, 500); }

    const lastUpdatedByContact = new Map<string, string>();
    for (const p of (profiles ?? []) as Array<{ contact_id: string; last_updated_at: string | null }>) {
      if (p.last_updated_at) lastUpdatedByContact.set(p.contact_id, p.last_updated_at);
    }

    const now = Date.now();
    const minIntervalMs = MIN_INTERVAL_MIN * 60_000;

    const eligible = candidates.filter((c) => {
      const last = lastUpdatedByContact.get(c.contact_id);
      if (!last) return true; // nunca gerado — pode processar
      const lastMs = new Date(last).getTime();
      // Debounce: só reanalisa se passou intervalo mínimo
      if (now - lastMs < minIntervalMs) return false;
      // Só reanalisa se há feedback negativo posterior à última análise
      return new Date(c.lastFb).getTime() > lastMs;
    });

    // 5) Priorizar mais reprovados primeiro; limitar a BATCH_SIZE
    eligible.sort((a, b) => b.down - a.down);
    const batch = eligible.slice(0, BATCH_SIZE);

    let processed = 0;
    let failed = 0;
    const errors: Array<{ contact_id: string; message: string }> = [];

    for (const item of batch) {
      try {
        const resp = await fetchAPI(`${SUPABASE_URL}/functions/v1/generate-behavioral-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-key': SERVICE_KEY,
            'Authorization': 'Bearer ' + SERVICE_KEY,
            'apikey': SERVICE_KEY,
            'x-cron-secret': Deno.env.get('CRON_SECRET') ?? '',
          },
          body: JSON.stringify({ contact_id: item.contact_id, user_id: item.userId }),
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${text.slice(0, 120)}`);
        }
        processed += 1;
      } catch (e) {
        failed += 1;
        errors.push({ contact_id: item.contact_id, message: (e as Error).message });
      }
      // Rate-limit gentle entre chamadas de IA
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    return jsonWithCors({
      ok: true,
      considered: candidates.length,
      eligible: eligible.length,
      processed,
      skipped: eligible.length - batch.length,
      failed,
      errors: errors.slice(0, 5),
      sla: { threshold: DOWN_THRESHOLD, batch_size: BATCH_SIZE, min_interval_min: MIN_INTERVAL_MIN },
    });
  } catch (e) {
    console.error("auto-rebatch-behavioral error:", e);
    return jsonWithCors({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}