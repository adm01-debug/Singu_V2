// Edge function: revops-snapshot-builder
// Cron diário 04:00 UTC. Consolida funil ponta-a-ponta por usuário ativo, gera snapshots e alertas.
import { createClient } from "npm:@supabase/supabase-js@2";
import { guardBody, scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";

const STAGES = ["visitor", "lead", "mql", "sql", "opportunity", "customer"] as const;

Deno.serve(async (req: Request) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const today = new Date().toISOString().slice(0, 10);

  let targetUserId: string | null = null;
  const _body = rawBody as { user_id?: string } | null;
  if (_body?.user_id) targetUserId = _body.user_id;

  // Discover active users in parallel
  let userIds: string[] = [];
  if (targetUserId) {
    userIds = [targetUserId];
  } else {
    const [{ data: u1 }, { data: u2 }] = await Promise.all([
      supabase.from("mql_classifications").select("user_id").limit(1000),
      supabase.from("deal_forecasts").select("user_id").limit(1000),
    ]);
    const set = new Set<string>();
    (u1 || []).forEach((r: { user_id: string }) => set.add(r.user_id));
    (u2 || []).forEach((r: { user_id: string }) => set.add(r.user_id));
    userIds = Array.from(set);
  }

  console.log(JSON.stringify({ fn: "revops-snapshot-builder", users: userIds.length, period: today }));

  const results: Array<{ user_id: string; ok: boolean; error?: string }> = [];

  for (const userId of userIds) {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Parallelize all 4 count queries
      const [
        { count: mqlCount },
        { count: sqlCount },
        { count: oppCount },
        { count: leadCount },
      ] = await Promise.all([
        supabase.from("mql_classifications").select("*", { count: "exact", head: true })
          .eq("user_id", userId).eq("status", "mql").gte("created_at", since),
        supabase.from("mql_classifications").select("*", { count: "exact", head: true })
          .eq("user_id", userId).eq("status", "sql").gte("created_at", since),
        supabase.from("deal_forecasts").select("*", { count: "exact", head: true })
          .eq("user_id", userId).gte("created_at", since),
        supabase.from("contacts").select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

      const stageCounts: Record<string, number> = {
        visitor: 0,
        lead: leadCount ?? 0,
        mql: mqlCount ?? 0,
        sql: sqlCount ?? 0,
        opportunity: oppCount ?? 0,
        customer: 0,
      };

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

      // Upsert snapshots + fetch previous week in parallel
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const [{ error: upErr }, { data: prevSnap }] = await Promise.all([
        supabase.from("revops_snapshots").upsert(rows, { onConflict: "user_id,period,funnel_stage" }),
        supabase.from("revops_snapshots").select("funnel_stage,conversion_rate")
          .eq("user_id", userId).eq("period", weekAgo),
      ]);
      if (upErr) throw upErr;

      const prevMap = new Map<string, number>();
      (prevSnap || []).forEach((r: { funnel_stage: string; conversion_rate: number | null }) => {
        if (r.conversion_rate != null) prevMap.set(r.funnel_stage, Number(r.conversion_rate));
      });

      // Collect all alerts then batch-insert
      const alerts: Array<Record<string, unknown>> = [];
      for (const stage of STAGES) {
        const cur = rows.find(r => r.funnel_stage === stage)?.conversion_rate;
        const prev = prevMap.get(stage);
        if (cur != null && prev != null && prev > 0) {
          const delta = ((cur - prev) / prev) * 100;
          if (delta <= -15) {
            alerts.push({
              user_id: userId,
              metric_key: `conversion_${stage}`,
              severity: delta <= -30 ? "critical" : "warning",
              message: `Conversão de ${stage} caiu ${Math.abs(delta).toFixed(1)}% vs semana anterior (${prev.toFixed(1)}% → ${cur.toFixed(1)}%)`,
              current_value: cur,
              expected_value: prev,
              period: today,
            });
          }
        }
      }

      if (alerts.length > 0) {
        await supabase.from("revops_alerts").insert(alerts);
      }

      results.push({ user_id: userId, ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ fn: "revops-snapshot-builder", user_id: userId, error: msg }));
      results.push({ user_id: userId, ok: false, error: msg });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
