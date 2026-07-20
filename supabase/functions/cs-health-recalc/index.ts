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

    for (const account of accounts ?? []) {
      const previousScore = account.health_score ?? 50;

      // Buscar signals dos últimos 90 dias
      const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const { data: signals } = await supabase
        .from("cs_health_signals")
        .select("score, weight, captured_at")
        .eq("account_id", account.id)
        .gte("captured_at", since);

      let weightedSum = 0;
      let weightTotal = 0;
      const now = Date.now();
      for (const s of signals ?? []) {
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

      const newStage = newScore < 40 ? "at_risk" : null;

      const updates: Record<string, unknown> = {
        health_score: newScore,
        health_trend: trend,
        last_health_recalc_at: new Date().toISOString(),
      };
      if (newStage) updates.lifecycle_stage = newStage;

      await supabase.from("cs_accounts").update(updates).eq("id", account.id);
      recalcCount++;

      // Alertas: queda >20pts ou score crítico <40
      const drop = previousScore - newScore;
      if (drop >= 20 || newScore < 40) {
        const severity = newScore < 30 || drop >= 30 ? "critical" : "warning";
        await supabase.from("alerts").insert({
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

    return jsonOk({ recalculated: recalcCount, alerts_generated: alertCount }, req);
  } catch (e) {
    console.error("cs-health-recalc error", e);
    console.error("cs-health-recalc error:", e);
    return jsonError("Internal server error", 500, req);
  }
});
