import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuthOrServiceRole, isServiceRoleCaller, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";
import { bestEffortWrite } from "../_shared/best-effort-write.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;

  // F/F15: aceita service-role (chamadas internas) ou JWT (UI)
  const auth = await withAuthOrServiceRole(req);
  if (auth instanceof Response) return auth;

  // F/F15: service-role (chamadas internas) n?o ? rate-limitado; JWT usa userId do token
  const callerUserId = isServiceRoleCaller(auth) ? null : auth;
  if (callerUserId) {
    const rl = limiter.check(callerUserId, req);
    if (rl) return rl;
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const start = Date.now();
  let result: Record<string, unknown> = {};
  let userId: string | null = null;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const vc = validate(rawBody, {
      contact_id: { type: 'string', required: true, maxLength: 36 },
      user_id: { type: 'string', maxLength: 36 }, // F/F15: service-role passa user_id no body
    });
    if (!vc.ok) return jsonError(vc.error, 400, req);
    const { contact_id } = vc.data as { contact_id: string };
    // F/F15: service-role caller usa user_id do body; JWT caller usa auth do token
    userId = isServiceRoleCaller(auth)
      ? (vc.data as { user_id?: string }).user_id ?? null
      : auth;
    if (!userId) return jsonError("user_id obrigatório para chamadas internas service-role", 400, req);

    // Verify contact ownership before triggering RPC
    const { data: owned, error: ownerErr } = await supabase
      .from('contacts').select('id').eq('id', contact_id).eq('user_id', userId).maybeSingle();
    if (ownerErr || !owned) return jsonError("Contact not found", 404, req);

    // Call the original score calculation
    const { data: scoreResult, error: scoreError } = await supabase.rpc('calculate_relationship_metrics_for_contact', { p_contact_id: contact_id });
    if (scoreError) throw scoreError;

    result = { scoreResult };

    await bestEffortWrite(supabase.from('crm_automation_logs').insert({
      user_id: userId,
      contact_id,
      automation_name: 'score_recalculation',
      status: 'success',
      execution_time_ms: Date.now() - start,
      result: result
    }), "crm_automation_logs insert error:");

    return jsonOk({ success: true, result }, req);

  } catch (error) {
    console.error("Automation Log Error:", error);

    await bestEffortWrite(supabase.from('crm_automation_logs').insert({
      user_id: userId,
      automation_name: 'score_recalculation_failed',
      status: 'failed',
      result: { error: error instanceof Error ? error.message : String(error) },
      execution_time_ms: Date.now() - start
    }), "crm_automation_logs error insert error:");

    return jsonError("Internal server error", 500, req);
  }
});
