// Cron job: reanalisa perfis comportamentais de contatos com 3+ reprovações
// SLA: não reprocessa o mesmo contato mais de 1x a cada 24h
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SLA_HOURS = 24;
const MIN_DOWNVOTES = 3;
const MAX_BATCH = 25; // limita por execução para evitar timeout

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // 2. Filtrar por SLA (última regeneração > 24h atrás)
    const contactIds = eligible.map((e) => e.contactId);
    const { data: recent, error: queueError } = await admin
      .from("behavioral_profile_regen_queue")
      .select("contact_id, last_processed_at")
      .in("contact_id", contactIds);

    if (queueError) throw queueError;

    const slaCutoff = Date.now() - SLA_HOURS * 3600 * 1000;
    const recentMap = new Map(
      (recent ?? []).map((r) => [r.contact_id as string, r.last_processed_at as string | null]),
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

    // 3. Enfileirar + disparar reanálise sequencialmente (evita rate limit)
    for (const item of toProcess) {
      const nowIso = new Date().toISOString();
      const { error: upsertError } = await admin
        .from("behavioral_profile_regen_queue")
        .upsert(
          {
            contact_id: item.contactId,
            user_id: item.userId,
            enqueued_at: nowIso,
            next_run_at: nowIso,
            trigger_source: "cron_auto_regen_downvotes",
            last_processed_at: nowIso,
          },
          { onConflict: "contact_id" },
        );

      if (upsertError) {
        failures.push({ contactId: item.contactId, error: upsertError.message });
        continue;
      }

      try {
        const { error: invokeError } = await admin.functions.invoke(
          "generate-behavioral-profile",
          { body: { contact_id: item.contactId, trigger: "auto_regen_sla" } },
        );
        if (invokeError) throw invokeError;
        processed += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failures.push({ contactId: item.contactId, error: msg });
        await admin
          .from("behavioral_profile_regen_queue")
          .update({ last_error: msg, attempts: 1 })
          .eq("contact_id", item.contactId);
      }

      // pequena pausa para não saturar edge function
      await new Promise((r) => setTimeout(r, 500));
    }

    return json({
      requestId,
      eligible: eligible.length,
      processed,
      skipped: eligible.length - toProcess.length,
      failures,
      elapsedMs: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auto-regen-behavioral-profiles]", requestId, message);
    return json({ requestId, error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}