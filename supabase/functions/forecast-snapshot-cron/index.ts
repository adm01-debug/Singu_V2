import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const cronCheck = requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { data: periods } = await admin.from("forecast_periods").select("id, user_id").eq("status", "open");
    if (!periods?.length) return new Response(JSON.stringify({ snapshots: 0 }), { headers: { ...cors, "Content-Type": "application/json" } });

    let count = 0;
    const today = new Date().toISOString().split("T")[0];
    for (const p of periods) {
      const { data: forecasts } = await admin.from("deal_forecasts").select("category, forecasted_amount, confidence_score").eq("period_id", p.id);
      if (!forecasts) continue;
      const commit = forecasts.filter(f => f.category === "commit").reduce((s, f) => s + Number(f.forecasted_amount), 0);
      const bestCase = forecasts.filter(f => f.category === "best_case").reduce((s, f) => s + Number(f.forecasted_amount), 0);
      const pipeline = forecasts.filter(f => f.category === "pipeline").reduce((s, f) => s + Number(f.forecasted_amount), 0);
      const weighted = forecasts.reduce((s, f) => s + Number(f.forecasted_amount) * (f.confidence_score / 100), 0);
      await admin.from("forecast_snapshots").upsert({
        user_id: p.user_id, period_id: p.id, snapshot_date: today,
        commit_total: commit, best_case_total: bestCase, pipeline_total: pipeline,
        weighted_total: weighted, deal_count: forecasts.length,
        snapshot_data: { by_category: { commit: forecasts.filter(f => f.category === "commit").length } },
      }, { onConflict: "period_id,snapshot_date" });
      count++;
    }
    return new Response(JSON.stringify({ snapshots: count }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
