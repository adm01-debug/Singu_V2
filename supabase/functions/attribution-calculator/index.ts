import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "attribution-calculator");

  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const authResult = await withAuth(req);
  if (typeof authResult !== "string") return authResult;
  const userId = authResult;

  try {
    const { deal_id, model = "linear", deal_value = 0 } = await req.json();
    if (!deal_id) {
      log.warn("missing_deal_id");
      return jsonError("deal_id required", 400, req);
    }

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
    return jsonError(msg, 500, req);
  }
});
