import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

interface ScoreBreakdown {
  fit: number;
  engagement: number;
  intent: number;
  influence: number;
}

const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Muitas requisições de scoring. Aguarde." });

function calcFitScore(tier: string, hasRevenue: boolean): number {
  const tierPoints: Record<string, number> = { strategic: 30, enterprise: 25, mid: 18, smb: 10 };
  return Math.min(30, (tierPoints[tier] ?? 15) + (hasRevenue ? 0 : -5));
}

function calcEngagementScore(committeeSize: number, dealsCount: number, interactionsCount: number): number {
  const committeePts = Math.min(10, committeeSize * 2);
  const dealsPts = Math.min(10, dealsCount * 3);
  const interactionPts = Math.min(10, Math.floor(interactionsCount / 5));
  return committeePts + dealsPts + interactionPts;
}

function calcIntentScore(recentInteractions: number, hasOpenDeal: boolean): number {
  const recencyPts = Math.min(15, recentInteractions * 2);
  const dealPts = hasOpenDeal ? 10 : 0;
  return recencyPts + dealPts;
}

function calcInfluenceScore(committeeSize: number, hasChampion: boolean, hasDecisionMaker: boolean): number {
  const sizePts = Math.min(10, committeeSize * 2);
  return Math.min(25, sizePts + (hasChampion ? 8 : 0) + (hasDecisionMaker ? 7 : 0));
}

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "abm-account-scorer");

  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const authResult = await withAuth(req);
  if (typeof authResult !== "string") return authResult;
  const userId = authResult;

  const limited = limiter.check(userId, req);
  if (limited) {
    log.warn("rate_limit_exceeded", { userId });
    return limited;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const accountId: string | undefined = body.account_id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    log.info("scoring_started", { userId, accountId });

    let query = supabase.from("abm_accounts").select("*").eq("user_id", userId);
    if (accountId) query = query.eq("id", accountId);
    const { data: accounts, error } = await query;
    if (error) {
      log.error("fetch_accounts_failed", { error: error.message });
      return jsonError(error.message, 500, req);
    }
    
    if (!accounts || accounts.length === 0) {
      log.info("no_accounts_to_score");
      return jsonOk({ scored: 0, accounts: [] }, req);
    }

    const updates: Array<{ id: string; account_score: number; score_breakdown: ScoreBreakdown }> = [];

    for (const acc of accounts) {
      const { data: committee } = await supabase
        .from("abm_buying_committee")
        .select("committee_role")
        .eq("account_id", acc.id);

      const committeeSize = committee?.length ?? 0;
      const hasChampion = committee?.some((c) => c.committee_role === "champion") ?? false;
      const hasDecisionMaker = committee?.some((c) => c.committee_role === "decision_maker") ?? false;

      const fit = calcFitScore(acc.tier, !!acc.target_revenue);
      const engagement = calcEngagementScore(committeeSize, 0, 0);
      const intent = calcIntentScore(0, false);
      const influence = calcInfluenceScore(committeeSize, hasChampion, hasDecisionMaker);

      const total = Math.min(100, fit + engagement + intent + influence);
      const breakdown: ScoreBreakdown = { fit, engagement, intent, influence };

      updates.push({ id: acc.id, account_score: total, score_breakdown: breakdown });

      const { error: updateErr } = await supabase
        .from("abm_accounts")
        .update({ 
          account_score: total, 
          score_breakdown: breakdown, 
          last_scored_at: new Date().toISOString() 
        })
        .eq("id", acc.id);
      
      if (updateErr) {
        log.error("update_account_failed", { accountId: acc.id, error: updateErr.message });
      }
    }

    log.info("scoring_complete", { count: updates.length });
    return jsonOk({ scored: updates.length, accounts: updates, traceId }, req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    log.error("fatal_error", { error: msg });
    return jsonError(msg, 500, req);
  }
});
