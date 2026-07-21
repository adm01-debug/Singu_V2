// ============================================================================
// clear-must-reset-flag
// ----------------------------------------------------------------------------
// Chamada pelo client APÓS updateUser({ password }) bem-sucedido durante o
// fluxo forçado de reset pós-migração. Remove a flag must_reset_password do
// raw_user_meta_data do próprio usuário autenticado e marca completed_at
// em migration_password_reset_log.
//
// Segurança:
//   - Exige JWT válido (usuário autenticado).
//   - Só limpa a flag do próprio usuário (nunca de terceiros).
//   - Usa service_role internamente para tocar auth.users.
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return json({ error: "missing_authorization" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Valida o JWT do chamador
    const asUser = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await asUser.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "invalid_token" }, 401);
    }

    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Lê metadata atual e remove as chaves específicas
    const { data: current, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr || !current?.user) {
      return json({ error: "user_lookup_failed" }, 500);
    }

    const meta = { ...(current.user.user_metadata ?? {}) } as Record<string, unknown>;
    delete meta.must_reset_password;
    delete meta.migrated_at;

    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: meta,
    });
    if (updErr) {
      return json({ error: "update_failed", detail: updErr.message }, 500);
    }

    // Marca completion no log (best-effort — não falha o request se der erro)
    await admin
      .from("migration_password_reset_log")
      .update({ completed_at: new Date().toISOString(), status: "sent" })
      .eq("user_id", userId);

    return json({ ok: true }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: "unexpected", detail: message }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}