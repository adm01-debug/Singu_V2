// Edge function: revops-snapshot-builder
// Cron diário 04:00 UTC. Consolida funil ponta-a-ponta por usuário ativo, gera snapshots e alertas.
import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret} from "../_shared/auth.ts";


const STAGES = ["visitor", "lead", "mql", "sql", "opportunity", "customer"] as const;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  // Auth: cron secret OR service role
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  const auth = req.headers.get("Authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const isAuthorized = (cronSecret && provided === cronSecret) || auth === `Bearer ${serviceKey}`;
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const today = new Date().toISOString().slice(0, 10);

  // Optional: process specific user if posted
  let targetUserId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.user_id) targetUserId = body.user_id;
  } catch { /* noop */ }

  // Discover active users (those with mql_classifications or deal_forecasts)
  let userIds: string[] = [];
  if (targetUserId) {
    userIds = [targetUserId];
  } else {
    const { data: u1 } = await supabase.from("mql_classifications").select("user_id").limit(1000);
    const { data: u2 } = await supabase.from("deal_forecasts").select("user_id").limit(1000);
    const set = new Set<string>();
    (u1 || []).forEach((r: any) => set.add(r.user_id));
    (u2 || []).forEach((r: any) => set.add(r.user_id));
    userIds = Array.from(set);
  }

  console.log(JSON.stringify({ fn: "revops-snapshot-builder", users: userIds.length, period: today }));

  const results: Array<{ user_id: string; ok: boolean; error?: string }> = [];

  for (const userId of userIds) {
    try {
      // Counts per stage in last 30d
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { count: mqlCount = 0 } = await supabase.from("mql_classifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId).eq("status", "mql").gte("created_at", since);
      const { count: sqlCount = 0 } = await supabase.from("mql_classifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId).eq("status", "sql").gte("created_at", since);
      const { count: oppCount = 0 } = await supabase.from("deal_forecasts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", since);

      const { data: leadCountData } = await supabase.from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      const leadCount = (leadCountData as any)?.length ?? 0;

      const stageCounts: Record<string, number> = {
        visitor: 0,
        lead: leadCount || 0,
        mql: mqlCount || 0,
        sql: sqlCount || 0,
        opportunity: oppCount || 0,
        customer: 0,
      };

      // Compute conversion_rate stage-to-stage
      const rows = STAGES.map((stage, idx) => {
        const prev = idx > 0 ? stageCounts[STAGES[idx - 1]] : 0;
        const cur = stageCounts[stage];
        const conv = prev > 0 ? Math.round((cur / prev) * 10000) / 100 : null;
        return {
          user_id: userId,
          period: today,
          funnel_stage: stage,
          count: cur,
          conversion_rate: conv,
          avg_velocity_days: null,
          total_value: 0,
        };
      });

      const { error: upErr } = await supabase.from("revops_snapshots")
        .upsert(rows, { onConflict: "user_id,period,funnel_stage" });
      if (upErr) throw upErr;

      // Compare vs 7d ago for MQL→SQL drop alerts
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data: prevSnap } = await supabase.from("revops_snapshots")
        .select("funnel_stage,conversion_rate")
        .eq("user_id", userId).eq("period", weekAgo);

      const prevMap = new Map<string, number>();
      (prevSnap || []).forEach((r: any) => { if (r.conversion_rate != null) prevMap.set(r.funnel_stage, Number(r.conversion_rate)); });

      for (const stage of STAGES) {
        const cur = rows.find(r => r.funnel_stage === stage)?.conversion_rate;
        const prev = prevMap.get(stage);
        if (cur != null && prev != null && prev > 0) {
          const delta = ((cur - prev) / prev) * 100;
          if (delta <= -15) {
            const severity = delta <= -30 ? "critical" : "warning";
            await supabase.from("revops_alerts").insert({
              user_id: userId,
              metric_key: `conversion_${stage}`,
              severity,
              message: `Conversão de ${stage} caiu ${Math.abs(delta).toFixed(1)}% vs semana anterior (${prev.toFixed(1)}% → ${cur.toFixed(1)}%)`,
              current_value: cur,
              expected_value: prev,
              period: today,
            });
          }
        }
      }

      results.push({ user_id: userId, ok: true });
    } catch (err: any) {
      console.error(JSON.stringify({ fn: "revops-snapshot-builder", user_id: userId, error: err.message }));
      results.push({ user_id: userId, ok: false, error: err.message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
