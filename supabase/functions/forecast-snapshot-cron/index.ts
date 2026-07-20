import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { data: periods } = await admin.from("forecast_periods").select("id, user_id").eq("status", "open");
    if (!periods?.length) return new Response(JSON.stringify({ snapshots: 0 }), { headers: { ...cors, "Content-Type": "application/json" } });

    const today = new Date().toISOString().split("T")[0];
    const periodIds = periods.map((p) => p.id);

    // Batch-fetch all forecasts for all open periods in one query
    const { data: allForecasts } = await admin
      .from("deal_forecasts")
      .select("period_id, category, forecasted_amount, confidence_score")
      .in("period_id", periodIds);

    const forecastsByPeriod = new Map<string, typeof allForecasts>(
      periodIds.map((id) => [id, []])
    );
    for (const f of allForecasts ?? []) {
      forecastsByPeriod.get(f.period_id)?.push(f);
    }

    // Accumulate snapshot rows and bulk-upsert in one call
    const snapshotRows = [];
    for (const p of periods) {
      const forecasts = forecastsByPeriod.get(p.id) ?? [];
      if (!forecasts.length) continue;
      const commit = forecasts.filter(f => f.category === "commit").reduce((s, f) => s + Number(f.forecasted_amount), 0);
      const bestCase = forecasts.filter(f => f.category === "best_case").reduce((s, f) => s + Number(f.forecasted_amount), 0);
      const pipeline = forecasts.filter(f => f.category === "pipeline").reduce((s, f) => s + Number(f.forecasted_amount), 0);
      const weighted = forecasts.reduce((s, f) => s + Number(f.forecasted_amount) * (f.confidence_score / 100), 0);
      snapshotRows.push({
        user_id: p.user_id, period_id: p.id, snapshot_date: today,
        commit_total: commit, best_case_total: bestCase, pipeline_total: pipeline,
        weighted_total: weighted, deal_count: forecasts.length,
        snapshot_data: { by_category: { commit: forecasts.filter(f => f.category === "commit").length } },
      });
    }

    if (snapshotRows.length > 0) {
      await admin.from("forecast_snapshots").upsert(snapshotRows, { onConflict: "period_id,snapshot_date" });
    }
    return new Response(JSON.stringify({ snapshots: snapshotRows.length }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("forecast-snapshot-cron error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
