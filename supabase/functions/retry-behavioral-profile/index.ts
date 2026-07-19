// Proxy service-role para retry manual de reanálise comportamental por admin.
// - Verifica o JWT do chamador
// - Valida que o usuário tem role 'admin' via has_role RPC
// - Invoca generate-behavioral-profile com x-internal-key (bypass RLS)
// - Atualiza a fila com o resultado (sucesso ou erro)
import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders } from "../_shared/auth.ts";


Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const requestId = crypto.randomUUID();

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Não autenticado", requestId }, 401);

    // 1) Identifica o usuário chamador
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Sessão inválida", requestId }, 401);
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
      return json({ error: "Acesso negado: requer admin", requestId }, 403);
    }

    // 3) Valida input
    const body = (await req.json().catch(() => ({}))) as {
      contact_id?: string;
      trigger?: string;
    };
    if (!body.contact_id || typeof body.contact_id !== "string") {
      return json({ error: "contact_id obrigatório", requestId }, 400);
    }
    const triggerSource = body.trigger || `manual_retry:${callerId.slice(0, 8)}`;

    // 4) Busca user_id dono do contato + estado atual da fila (cooldown)
    const { data: contactRow, error: contactErr } = await admin
      .from("contacts")
      .select("user_id")
      .eq("id", body.contact_id)
      .maybeSingle();
    if (contactErr) throw contactErr;
    if (!contactRow?.user_id) {
      return json({ error: "Contato não encontrado", requestId }, 404);
    }
    const ownerId = contactRow.user_id as string;

    // 4.1) Cooldown: 5 min entre retries manuais do mesmo contato
    //      Evita cliques repetidos, race entre admins e custo de LLM.
    const COOLDOWN_MS = 5 * 60 * 1000;
    const { data: queueRow } = await admin
      .from("behavioral_profile_regen_queue")
      .select("last_processed_at, trigger_source")
      .eq("contact_id", body.contact_id)
      .maybeSingle();
    if (queueRow?.last_processed_at) {
      const lastMs = new Date(queueRow.last_processed_at as string).getTime();
      const ageMs = Date.now() - lastMs;
      const wasManual = String(queueRow.trigger_source ?? "").startsWith("manual_retry");
      if (wasManual && ageMs < COOLDOWN_MS) {
        const retryInSec = Math.ceil((COOLDOWN_MS - ageMs) / 1000);
        return json(
          {
            error: `Aguarde ${retryInSec}s antes de reenfileirar este contato novamente.`,
            requestId,
            cooldown: true,
            retry_in_seconds: retryInSec,
          },
          429,
        );
      }
    }

    // 5) Marca fila como retry em andamento (sem tocar last_processed_at ainda)
    const enqueuedIso = new Date().toISOString();
    await admin.from("behavioral_profile_regen_queue").upsert(
      {
        contact_id: body.contact_id,
        user_id: ownerId,
        enqueued_at: enqueuedIso,
        next_run_at: enqueuedIso,
        trigger_source: triggerSource,
        last_error: null,
      },
      { onConflict: "contact_id" },
    );

    // 6) Invoca gerador com service-role (bypass RLS: admin não precisa ter acesso ao histórico)
    let invokeError: string | null = null;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/generate-behavioral-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": SERVICE_KEY,
          "Authorization": `Bearer ${SERVICE_KEY}`,
          "apikey": SERVICE_KEY,
        },
        body: JSON.stringify({
          contact_id: body.contact_id,
          user_id: ownerId,
          trigger: triggerSource,
        }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        invokeError = `[${resp.status}] ${txt.slice(0, 300)}`;
      } else {
        // consome body para evitar leak
        await resp.text();
      }
    } catch (e) {
      invokeError = e instanceof Error ? e.message : String(e);
    }

    const finishedIso = new Date().toISOString();
    if (invokeError) {
      // Incrementa attempts corretamente
      const { data: cur } = await admin
        .from("behavioral_profile_regen_queue")
        .select("attempts")
        .eq("contact_id", body.contact_id)
        .maybeSingle();
      const prev = (cur as { attempts?: number } | null)?.attempts ?? 0;
      await admin
        .from("behavioral_profile_regen_queue")
        .update({
          last_error: `manual_retry_failed: ${invokeError}`.slice(0, 500),
          attempts: prev + 1,
          last_processed_at: finishedIso,
        })
        .eq("contact_id", body.contact_id);
      return json({ ok: false, error: invokeError, requestId }, 502);
    }

    await admin
      .from("behavioral_profile_regen_queue")
      .update({
        last_error: null,
        last_processed_at: finishedIso,
      })
      .eq("contact_id", body.contact_id);

    return json({ ok: true, requestId, contact_id: body.contact_id, trigger: triggerSource });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[retry-behavioral-profile]", requestId, msg);
    return json({ error: msg, requestId }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}