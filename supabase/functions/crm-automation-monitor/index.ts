import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const rl = limiter.check(userId, req);
  if (rl) return rl;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const start = Date.now();
  let result: Record<string, unknown> = {};

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const vc = validate(rawBody, {
      contact_id: { type: 'string', required: true, maxLength: 36 },
    });
    if (!vc.ok) return jsonError(vc.error, 400, req);
    const { contact_id } = vc.data as { contact_id: string };

    // Verify contact ownership before triggering RPC
    const { data: owned, error: ownerErr } = await supabase
      .from('contacts').select('id').eq('id', contact_id).eq('user_id', userId).maybeSingle();
    if (ownerErr || !owned) return jsonError("Contact not found", 404, req);

    // Call the original score calculation
    const { data: scoreResult, error: scoreError } = await supabase.rpc('calculate_relationship_metrics_for_contact', { p_contact_id: contact_id });
    if (scoreError) throw scoreError;

    result = { scoreResult };

    // Log the automation execution (fire-and-forget — response uses in-memory result)
    supabase.from('crm_automation_logs').insert({
      user_id: userId,
      contact_id,
      automation_name: 'score_recalculation',
      status: 'success',
      execution_time_ms: Date.now() - start,
      result: result
    }).catch((e: unknown) => console.error("crm_automation_logs insert error:", e));

    return jsonOk({ success: true, result }, req);

  } catch (error) {
    console.error("Automation Log Error:", error);

    supabase.from('crm_automation_logs').insert({
      user_id: userId,
      automation_name: 'score_recalculation_failed',
      status: 'failed',
      result: { error: error instanceof Error ? error.message : String(error) },
      execution_time_ms: Date.now() - start
    }).catch((e: unknown) => console.error("crm_automation_logs error insert error:", e));

    return jsonError("Internal server error", 500, req);
  }
});
