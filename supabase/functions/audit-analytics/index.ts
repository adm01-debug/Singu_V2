import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "audit-analytics");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authResult = await withAuth(req);
    if (typeof authResult !== "string") return authResult;
    const userId = authResult;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    log.info("analysis_started", { userId });

    // Fetch last 30 days of audit logs for this user
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logs, error } = await supabase
      .from("audit_log")
      .select("entity_type, action, created_at, user_id")
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      log.error("fetch_logs_failed", { error: error.message });
      throw error;
    }

    // Top entities
    const entityCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    const hourCounts: Record<number, number> = {};

    (logs || []).forEach((log: { entity_type: string; action: string; created_at: string }) => {
      entityCounts[log.entity_type] = (entityCounts[log.entity_type] || 0) + 1;
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      const hour = new Date(log.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const topEntities = Object.entries(entityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([entity, count]) => ({ entity, count }));

    const operationsByType = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }));

    const activityByHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: hourCounts[h] || 0,
    }));

    log.info("analysis_complete", { totalLogs: (logs || []).length });

    return jsonOk({
      total_logs: (logs || []).length,
      top_entities: topEntities,
      operations_by_type: operationsByType,
      activity_by_hour: activityByHour,
      period: "30d",
      traceId
    }, req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    log.error("fatal_error", { error: msg });
    return jsonError(msg, 500, req);
  }
});
