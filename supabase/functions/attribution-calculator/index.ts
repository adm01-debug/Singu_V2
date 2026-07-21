import { handleCorsAndMethod, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "attribution-calculator");

  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const authResult = await withAuth(req);
  if (typeof authResult !== "string") return authResult;
  const userId = authResult;

  const rl = limiter.check(userId, req);
  if (rl) return rl;

  const { body: rawBody, error: bodyError } = await guardBody(req, 128 * 1024);
  if (bodyError) return bodyError;

  const v = validate(rawBody, {
    deal_id:    { type: 'string', required: true, maxLength: 36 },
    model:      { type: 'string', maxLength: 20 },
    deal_value: { type: 'number', min: 0 },
  });
  if (!v.ok) { log.warn("invalid_input", { error: v.error }); return jsonError(v.error, 400, req); }
  const { deal_id, model = "linear", deal_value = 0 } = v.data as { deal_id: string; model?: string; deal_value?: number };

  try {

    log.info("calculation_started", { userId, dealId: deal_id, model });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("compute_attribution", {
      _deal_id: deal_id,
      _model: model,
      _deal_value: deal_value,
    });
    
    if (error) {
      log.error("rpc_compute_failed", { error: error.message });
      throw error;
    }

    log.info("calculation_complete", { dealId: deal_id });

    return jsonOk({ ok: true, result: data, traceId }, req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    log.error("fatal_error", { error: msg });
    return jsonError("Internal server error", 500, req);
  }
});
