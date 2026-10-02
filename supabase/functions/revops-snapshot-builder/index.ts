// Edge function: revops-snapshot-builder
// Cron diário 04:00 UTC. Consolida funil ponta-a-ponta por usuário ativo, gera snapshots e alertas.
import { createClient } from "npm:@supabase/supabase-js@2";
import { guardBody, scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";
import { validate } from "../_shared/validate.ts";
import { fetchAllPages } from "../_shared/pagination.ts";

const STAGES = ["visitor", "lead", "mql", "sql", "opportunity", "customer"] as const;

function countByUser(rows: Array<{ user_id: string }> | null): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows ?? []) map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1);
  return map;
}

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
  if (rawBody) {
    const vrb = validate(rawBody, { user_id: { type: 'string', maxLength: 36 } });
    if (vrb.ok && vrb.data.user_id) targetUserId = vrb.data.user_id as string;
  }

  let userIds: string[] = [];
  if (targetUserId) {
    userIds = [targetUserId];
  } else {
    const [u1, u2] = await Promise.all([
      fetchAllPages((from, to) =>
        supabase.from("mql_classifications").select("user_id").order("created_at").order("id").range(from, to)
      ),
      fetchAllPages((from, to) =>
        supabase.from("deal_forecasts").select("user_id").order("created_at").order("id").range(from, to)
      ),
    ]);
    const set = new Set<string>();
    u1.forEach((r: { user_id: string }) => set.add(r.user_id));
    u2.forEach((r: { user_id: string }) => set.add(r.user_id));
    userIds = Array.from(set);
  }

  if (userIds.length === 0) {
    return new Response(JSON.stringify({ processed: 0, results: [] }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  console.log(JSON.stringify({ fn: "revops-snapshot-builder", users: userIds.length, period: today }));

  // --- PRE-BATCH PHASE: all counts and previous-week snapshots in one round-trip ---
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [mqlRows, sqlRows, oppRows, leadRows, prevSnapRows] = await Promise.all([
    fetchAllPages((from, to) =>
      supabase.from("mql_classifications").select("user_id").in("user_id", userIds).eq("status", "mql").gte("created_at", since).order("created_at").order("id").range(from, to)
    ),
    fetchAllPages((from, to) =>
      supabase.from("mql_classifications").select("user_id").in("user_id", userIds).eq("status", "sql").gte("created_at", since).order("created_at").order("id").range(from, to)
    ),
    fetchAllPages((from, to) =>
      supabase.from("deal_forecasts").select("user_id").in("user_id", userIds).gte("created_at", since).order("created_at").order("id").range(from, to)
    ),
    fetchAllPages((from, to) =>
      supabase.from("contacts").select("user_id").in("user_id", userIds).order("created_at").order("id").range(from, to)
    ),
    fetchAllPages((from, to) =>
      supabase.from("revops_snapshots").select("user_id, funnel_stage, conversion_rate").in("user_id", userIds).eq("period", weekAgo).order("created_at").order("id").range(from, to)
    ),
  ]);

  const mqlByUser = countByUser(mqlRows as Array<{ user_id: string }>);
  const sqlByUser = countByUser(sqlRows as Array<{ user_id: string }>);
  const oppByUser = countByUser(oppRows as Array<{ user_id: string }>);
  const leadByUser = countByUser(leadRows as Array<{ user_id: string }>);

  type PrevSnapRow = { user_id: string; funnel_stage: string; conversion_rate: number | null };
  const prevSnapsByUser = new Map<string, Map<string, number>>();
  for (const r of prevSnapRows as PrevSnapRow[]) {
    if (r.conversion_rate == null) continue;
    const userMap = prevSnapsByUser.get(r.user_id) ?? new Map<string, number>();
    userMap.set(r.funnel_stage, Number(r.conversion_rate));
    prevSnapsByUser.set(r.user_id, userMap);
  }

  // --- ACCUMULATION LOOP (pure in-memory, no DB calls) ---
  const results: Array<{ user_id: string; ok: boolean; error?: string }> = [];
  const allSnapshotRows: Array<Record<string, unknown>> = [];
  const allAlertRows: Array<Record<string, unknown>> = [];

  for (const userId of userIds) {
    try {
      const stageCounts: Record<string, number> = {
        visitor: 0,
        lead: leadByUser.get(userId) ?? 0,
        mql: mqlByUser.get(userId) ?? 0,
        sql: sqlByUser.get(userId) ?? 0,
        opportunity: oppByUser.get(userId) ?? 0,
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

      for (const row of rows) allSnapshotRows.push(row);

      const prevMap = prevSnapsByUser.get(userId) ?? new Map<string, number>();
      for (const stage of STAGES) {
        const cur = rows.find(r => r.funnel_stage === stage)?.conversion_rate;
        const prev = prevMap.get(stage);
        if (cur != null && prev != null && prev > 0) {
          const delta = ((cur - prev) / prev) * 100;
          if (delta <= -15) {
            allAlertRows.push({
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

      results.push({ user_id: userId, ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ fn: "revops-snapshot-builder", user_id: userId, error: msg }));
      results.push({ user_id: userId, ok: false, error: msg });
    }
  }

  // --- BULK FLUSH ---
  const [snapRes, alertRes] = await Promise.all([
    allSnapshotRows.length > 0
      ? supabase.from("revops_snapshots").upsert(allSnapshotRows, { onConflict: "user_id,period,funnel_stage" })
      : Promise.resolve({ error: null }),
    allAlertRows.length > 0
      ? supabase.from("revops_alerts").insert(allAlertRows)
      : Promise.resolve({ error: null }),
  ]);
  if (snapRes.error) console.error(JSON.stringify({ fn: "revops-snapshot-builder", stage: "upsert", error: snapRes.error.message }));
  if (alertRes.error) console.error(JSON.stringify({ fn: "revops-snapshot-builder", stage: "alerts", error: alertRes.error.message }));

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
