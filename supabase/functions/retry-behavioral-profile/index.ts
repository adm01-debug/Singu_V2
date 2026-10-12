// Proxy service-role para retry manual de reanálise comportamental por admin.
// - Verifica o JWT do chamador
// - Valida que o usuário tem role 'admin' via has_role RPC
// - Invoca generate-behavioral-profile com x-internal-key (bypass RLS)
// - Atualiza a fila com o resultado (sucesso ou erro)
import { createClient } from "npm:@supabase/supabase-js@2";
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";
import { AI_TIMEOUT_MS, fetchWithTimeout } from "../_shared/fetch-utils.ts";
import { validate } from "../_shared/validate.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20, message: "Limite de reanálises atingido. Aguarde um minuto." });
interface RetryClaim { contact_id: string; user_id: string; claim_token: string; attempts: number }


Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const requestId = crypto.randomUUID();

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Não autenticado", requestId }, 401, cors);

    // 1) Identifica o usuário chamador
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Sessão inválida", requestId }, 401, cors);
    }
    const callerId = userData.user.id;

    // 2) Valida admin
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr) throw roleErr;
    if (!isAdmin) {
      return json({ error: "Acesso negado: requer admin", requestId }, 403, cors);
    }
    const limited = limiter.check(callerId, req);
    if (limited) return limited;

    // 3) Valida input
    const vr = validate(rawBody, {
      contact_id: { type: 'string', required: true, maxLength: 36 },
      trigger:    { type: 'string', maxLength: 100 },
    });
    if (!vr.ok) return json({ error: vr.error, requestId }, 400, cors);
    const { contact_id: contactId, trigger } = vr.data as { contact_id: string; trigger?: string };
    const triggerSource = trigger || `manual_retry:${callerId.slice(0, 8)}`;

    const { data: claim, error: claimError } = await admin.rpc("claim_behavioral_profile_retry", {
      p_contact_id: contactId, p_actor_id: callerId,
    }).abortSignal(AbortSignal.timeout(5_000)).single<RetryClaim>();
    if (claimError?.code === "P0001") return json({ ok: false, error: claimError.message, cooldown: true, requestId }, 429, cors);
    if (claimError?.code === "22023") return json({ ok: false, error: "Contato não encontrado", requestId }, 404, cors);
    if (claimError?.code === "42501") return json({ ok: false, error: "Reanálise não autorizada", requestId }, 403, cors);
    if (claimError) throw claimError;
    if (!claim?.claim_token || !claim.user_id) throw new Error("Reserva da reanálise não confirmada");
    const ownerId = claim.user_id;

    // 6) Invoca gerador com service-role (bypass RLS: admin não precisa ter acesso ao histórico)
    let invokeError: string | null = null;
    try {
      const resp = await fetchWithTimeout(`${SUPABASE_URL}/functions/v1/generate-behavioral-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "apikey": SERVICE_KEY,
          "x-cron-secret": Deno.env.get("CRON_SECRET") ?? "",
        },
        body: JSON.stringify({
          contact_id: contactId,
          user_id: ownerId,
          claim_token: claim.claim_token,
          manual_retry: true,
          trigger: triggerSource,
        }),
      }, AI_TIMEOUT_MS + 15_000);
      if (!resp.ok) {
        const txt = await resp.text();
        invokeError = `[${resp.status}] ${txt.slice(0, 300)}`;
      } else {
        const receipt: { profile?: { contact_id?: string; user_id?: string } } | null = await resp.json();
        if (receipt?.profile?.contact_id !== contactId || receipt.profile.user_id !== ownerId) invokeError = "Perfil persistido não confirmado";
      }
    } catch (e) {
      invokeError = e instanceof Error ? e.message : String(e);
    }

    if (invokeError) {
      const { data: failed, error: failError } = await admin
        .from("behavioral_profile_regen_queue")
        .update({
          last_error: `manual_retry_failed: ${invokeError}`.slice(0, 500),
          next_run_at: new Date(Date.now() + Math.min(60, 5 * 2 ** (claim.attempts - 1)) * 60_000).toISOString(),
        })
        .eq("contact_id", contactId).eq("claim_token", claim.claim_token)
        .abortSignal(AbortSignal.timeout(5_000)).select("contact_id").maybeSingle();
      if (failError) throw failError;
      if (!failed) return json({ ok: false, error: "Reserva substituída por uma nova solicitação", requestId }, 409, cors);
      return json({ ok: false, error: invokeError, requestId }, 502, cors);
    }

    return json({ ok: true, requestId, contact_id: contactId, trigger: triggerSource }, 200, cors);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[retry-behavioral-profile]", requestId, msg);
    return json({ error: msg, requestId }, 500, cors);
  }
});

function json(body: unknown, status = 200, corsH: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsH, "Content-Type": "application/json" },
  });
}