// Cron job: reanalisa perfis comportamentais de contatos com 3+ reprovações
// SLA: não reprocessa o mesmo contato mais de 1x a cada 24h
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";
import { AI_TIMEOUT_MS } from "../_shared/fetch-utils.ts";


const MAX_BATCH = 5;

interface ClaimedContact {
  contact_id: string;
  user_id: string;
  claim_token: string;
}

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

    const { data, error } = await admin.rpc('claim_behavioral_profile_sla_batch', {
      p_limit: MAX_BATCH,
    });
    if (error) throw error;
    const claimed = (data ?? []) as ClaimedContact[];
    if (claimed.length > MAX_BATCH || claimed.some((claim) =>
      !claim.contact_id || !claim.user_id || !claim.claim_token
    )) throw new Error('Lote de reservas comportamentais inválido');
    if (claimed.length === 0) {
      return json({ requestId, processed: 0, claimed: 0, message: "nenhum contato elegível" });
    }

    let processed = 0;
    const failures: Array<{ contactId: string; error: string }> = [];

    async function processClaim(item: ClaimedContact) {
      try {
        const { data: receipt, error: invokeError } = await admin.functions.invoke<{ profile?: { contact_id?: string; user_id?: string } }>(
          "generate-behavioral-profile",
          {
            signal: AbortSignal.timeout(AI_TIMEOUT_MS + 15_000),
            body: { contact_id: item.contact_id, user_id: item.user_id,
              claim_token: item.claim_token, trigger: "auto_regen_sla" },
            headers: {
              "x-internal-key": serviceKey,
              "x-cron-secret": Deno.env.get("CRON_SECRET") ?? "",
            },
          },
        );
        if (invokeError) throw invokeError;
        if (receipt?.profile?.contact_id !== item.contact_id || receipt.profile.user_id !== item.user_id) {
          throw new Error('Perfil persistido não confirmado');
        }
        processed += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failures.push({ contactId: item.contact_id, error: msg });
        const { error: writeError } = await admin.from('behavioral_profile_regen_queue')
          .update({ last_error: msg.slice(0, 500) })
          .eq('contact_id', item.contact_id).eq('claim_token', item.claim_token);
        if (writeError) failures.push({ contactId: item.contact_id, error: writeError.message });
      }
    }
    await Promise.all(claimed.map(processClaim));

    return json({
      requestId,
      claimed: claimed.length,
      processed,
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