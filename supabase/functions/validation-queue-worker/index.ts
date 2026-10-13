import { createClient } from "npm:@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";


const limiter = rateLimit({ windowMs: 60_000, max: 12 });
const BATCH_SIZE = 10;
const MAX_ATTEMPTS = 3;

interface QueueItem {
  id: string;
  user_id: string;
  contact_id: string | null;
  kind: "email" | "phone";
  value: string;
  attempts: number;
  claim_token: string;
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "worker";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Atomically claim a batch: UPDATE+RETURNING with FOR UPDATE SKIP LOCKED prevents
    // two concurrent cron invocations from processing the same rows.
    const { data: items, error: fetchErr } = await admin
      .rpc("claim_validation_batch", { p_batch_size: BATCH_SIZE, p_max_attempts: MAX_ATTEMPTS });

    if (fetchErr) throw fetchErr;
    const queue = (items ?? []) as QueueItem[];

    if (queue.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "Fila vazia" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let okCount = 0;
    let errCount = 0;

    const outcomes = await Promise.allSettled(queue.map(async (item) => {
      const status = item.attempts >= MAX_ATTEMPTS ? "error" : "pending";
      let lastError: string | null = null;
      try {
        if (item.kind !== "email" && item.kind !== "phone") throw new Error("Tipo de validação desconhecido");
        const fnName = item.kind === "email" ? "email-verifier" : "phone-validator";
        const payload = item.kind === "email"
          ? { email: item.value, contactId: item.contact_id, userId: item.user_id, persist: true }
          : { phone: item.value, contactId: item.contact_id, userId: item.user_id, persist: true };

        // Invoca função interna com service role
        const resp = await fetchAPI(`${SUPABASE_URL}/functions/v1/${fnName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
            apikey: SERVICE_KEY,
          },
          body: JSON.stringify({ ...payload, queueId: item.id, claimToken: item.claim_token }),
        });

        if (resp.status === 409) { await resp.arrayBuffer(); return; }
        if (!resp.ok) {
          throw new Error(`${fnName}: HTTP ${resp.status}`);
        }
        const receipt: { queueId?: string; validationId?: string } | null = await resp.json();
        if (receipt?.queueId !== item.id || receipt.validationId !== item.id) {
          throw new Error("Validação persistida não confirmada");
        }
        okCount++;
        return;
      } catch (err) {
        lastError = String(err).slice(0, 500);
      }
      const { data, error } = await admin.from("validation_queue").update({
        status,
        attempts: item.attempts,
        last_error: lastError,
        processed_at: status === "pending" ? null : new Date().toISOString(),
        claim_token: null,
        lease_expires_at: null,
      }).eq("id", item.id).eq("status", "processing")
        .eq("claim_token", item.claim_token).select("id").maybeSingle();
      if (error) throw error;
      if (data) errCount++;
    }));
    if (outcomes.some((outcome) => outcome.status === "rejected")) {
      throw new Error("Não foi possível confirmar todos os itens da fila");
    }

    return new Response(
      JSON.stringify({ processed: okCount + errCount, ok: okCount, errors: errCount }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("validation-queue-worker error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
