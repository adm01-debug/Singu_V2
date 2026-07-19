import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const pre = handleCorsAndMethod(req);
  if (pre) return pre;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const rl = limiter.check(userId);
  if (rl) return rl;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const start = Date.now();
  let status = 'success';
  let result: any = {};

  try {
    const { contact_id } = await req.json();
    
    // Call the original score calculation
    const { data: scoreResult, error: scoreError } = await supabase.rpc('calculate_relationship_metrics_for_contact', { p_contact_id: contact_id });
    if (scoreError) throw scoreError;

    result = { scoreResult };

    // Log the automation execution
    await supabase.from('crm_automation_logs').insert({
      user_id: userId,
      contact_id,
      automation_name: 'score_recalculation',
      status: 'success',
      execution_time_ms: Date.now() - start,
      result: result
    });

    return jsonOk({ success: true, result }, req);

  } catch (error) {
    status = 'failed';
    console.error("Automation Log Error:", error);
    
    await supabase.from('crm_automation_logs').insert({
      user_id: userId,
      automation_name: 'score_recalculation_failed',
      status: 'failed',
      result: { error: error.message },
      execution_time_ms: Date.now() - start
    });

    return jsonError(error.message, 500);
  }
});
