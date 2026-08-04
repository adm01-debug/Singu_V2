import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret, jsonError, jsonOk } from "../_shared/auth.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: scopedCorsHeaders(req) });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: accounts, error } = await supabase
      .from("cs_accounts")
      .select("id, user_id, health_score, account_name")
      .neq("lifecycle_stage", "churned");

    if (error) throw error;

    let recalcCount = 0;
    let alertCount = 0;

    const accountList = accounts ?? [];
    if (accountList.length === 0) {
      return jsonOk({ recalculated: 0, alerts_generated: 0 }, req);
    }

    // Pre-fetch ALL signals for ALL accounts in one query
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const accountIds = accountList.map((a: { id: string }) => a.id);
    const { data: allSignals } = await supabase
      .from("cs_health_signals")
      .select("account_id, score, weight, captured_at")
      .in("account_id", accountIds)
      .gte("captured_at", since);

    const signalsByAccount = new Map<string, Array<{ score: unknown; weight: unknown; captured_at: string }>>();
    for (const s of allSignals ?? []) {
      if (!signalsByAccount.has(s.account_id)) signalsByAccount.set(s.account_id, []);
      signalsByAccount.get(s.account_id)!.push(s);
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // Accumulators — split by whether lifecycle_stage changes to avoid upsert column mismatch
    type AccountUpdate = { id: string; health_score: number; health_trend: string; last_health_recalc_at: string; lifecycle_stage?: string };
    const accountUpdates: AccountUpdate[] = [];
    const alertRows: Array<Record<string, unknown>> = [];

    for (const account of accountList) {
      const previousScore = account.health_score ?? 50;
      const signals = signalsByAccount.get(account.id) ?? [];

      let weightedSum = 0;
      let weightTotal = 0;
      for (const s of signals) {
        const daysAgo = (now - new Date(s.captured_at).getTime()) / 86400000;
        const decay = Math.exp(-daysAgo / 45);
        weightedSum += Number(s.score) * Number(s.weight) * decay;
        weightTotal += Number(s.weight) * decay;
      }

      const newScore = weightTotal > 0
        ? Math.max(0, Math.min(100, Math.round(weightedSum / weightTotal)))
        : previousScore;

      const trend = newScore - previousScore >= 5 ? "up"
        : previousScore - newScore >= 5 ? "down" : "stable";

      const row: AccountUpdate = { id: account.id, health_score: newScore, health_trend: trend, last_health_recalc_at: nowIso };
      if (newScore < 40) row.lifecycle_stage = "at_risk";
      accountUpdates.push(row);
      recalcCount++;

      // Alertas: queda >20pts ou score crítico <40
      const drop = previousScore - newScore;
      if (drop >= 20 || newScore < 40) {
        const severity = newScore < 30 || drop >= 30 ? "critical" : "warning";
        alertRows.push({
          user_id: account.user_id,
          type: "cs_health_drop",
          priority: severity === "critical" ? "high" : "medium",
          title: `Health score caiu: ${account.account_name}`,
          description: `Score: ${previousScore} → ${newScore} (queda de ${drop} pontos)`,
          action_url: `/customer-success/account/${account.id}`,
        });
        alertCount++;
      }
    }

    // Split updates to avoid upsert padding lifecycle_stage=null on rows that don't set it
    const withStage = accountUpdates.filter(r => r.lifecycle_stage !== undefined);
    const withoutStage = accountUpdates.filter(r => r.lifecycle_stage === undefined);

    const [r1, r2, r3] = await Promise.all([
      withStage.length > 0
        ? supabase.from("cs_accounts").upsert(withStage, { onConflict: "id" })
        : Promise.resolve({ error: null }),
      withoutStage.length > 0
        ? supabase.from("cs_accounts").upsert(withoutStage, { onConflict: "id" })
        : Promise.resolve({ error: null }),
      alertRows.length > 0
        ? supabase.from("alerts").insert(alertRows)
        : Promise.resolve({ error: null }),
    ]);
    if (r1.error) console.error("cs_accounts upsert (with stage) failed:", r1.error.message);
    if (r2.error) console.error("cs_accounts upsert (without stage) failed:", r2.error.message);
    if (r3.error) console.error("alerts insert failed:", r3.error.message);

    return jsonOk({ recalculated: recalcCount, alerts_generated: alertCount }, req);
  } catch (e) {
    console.error("cs-health-recalc error:", e);
    return jsonError("Internal server error", 500, req);
  }
});
