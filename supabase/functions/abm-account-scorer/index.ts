import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { validate } from "../_shared/validate.ts";

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

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const va = validate(rawBody ?? {}, {
      account_id: { type: 'string', maxLength: 36 },
    });
    if (!va.ok) return jsonError(va.error, 400, req);
    const { account_id: accountId } = va.data as { account_id?: string };

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
      return jsonError("Internal server error", 500, req);
    }
    
    if (!accounts || accounts.length === 0) {
      log.info("no_accounts_to_score");
      return jsonOk({ scored: 0, accounts: [] }, req);
    }

    const accountIds = accounts.map((a) => a.id);
    const externalCompanyIds = accounts.map((a) => a.external_company_id).filter(Boolean) as string[];

    // Batch-fetch all committee members (with external_contact_id for interaction linkage)
    const { data: allCommittee } = await supabase
      .from("abm_buying_committee")
      .select("account_id, committee_role, external_contact_id")
      .in("account_id", accountIds);

    const committeeByAccount = new Map<string, Array<{ committee_role: string; external_contact_id: string | null }>>();
    for (const c of allCommittee ?? []) {
      if (!committeeByAccount.has(c.account_id)) committeeByAccount.set(c.account_id, []);
      committeeByAccount.get(c.account_id)!.push(c);
    }

    // Batch-fetch deals grouped by company (external_company_id maps to deals.company_id)
    const dealsByCompany = new Map<string, { total: number; open: number }>();
    if (externalCompanyIds.length > 0) {
      const { data: companyDeals } = await supabase
        .from("deals")
        .select("company_id, status")
        .in("company_id", externalCompanyIds)
        .eq("user_id", userId);
      for (const d of companyDeals ?? []) {
        if (!d.company_id) continue;
        const entry = dealsByCompany.get(d.company_id) ?? { total: 0, open: 0 };
        entry.total++;
        if (d.status !== "closed_won" && d.status !== "closed_lost" && d.status !== "fechado") entry.open++;
        dealsByCompany.set(d.company_id, entry);
      }
    }

    // Batch-fetch recent interactions (90d) for committee contacts
    const allContactIds = [...new Set(
      (allCommittee ?? []).map((c) => c.external_contact_id).filter((id): id is string => !!id)
    )];
    const interactionsByContact = new Map<string, number>();
    if (allContactIds.length > 0) {
      const since90d = new Date(Date.now() - 90 * 86_400_000).toISOString();
      const { data: recentInteractions } = await supabase
        .from("interactions")
        .select("contact_id")
        .in("contact_id", allContactIds)
        .gte("created_at", since90d);
      for (const i of recentInteractions ?? []) {
        if (!i.contact_id) continue;
        interactionsByContact.set(i.contact_id, (interactionsByContact.get(i.contact_id) ?? 0) + 1);
      }
    }

    const returnUpdates: Array<{ id: string; account_score: number; score_breakdown: ScoreBreakdown }> = [];
    const upsertRows: Array<{ id: string; user_id: string; account_score: number; score_breakdown: ScoreBreakdown; last_scored_at: string }> = [];
    const now = new Date().toISOString();

    for (const acc of accounts) {
      const committee = committeeByAccount.get(acc.id) ?? [];
      const committeeSize = committee.length;
      const hasChampion = committee.some((c) => c.committee_role === "champion");
      const hasDecisionMaker = committee.some((c) => c.committee_role === "decision_maker");

      // Real dimensions from fetched data (fall back to 0 when no linkage found)
      const companyDealsData = dealsByCompany.get(acc.external_company_id) ?? { total: 0, open: 0 };
      const committeeInteractions = committee.reduce(
        (sum, c) => sum + (c.external_contact_id ? (interactionsByContact.get(c.external_contact_id) ?? 0) : 0),
        0,
      );

      const fit = calcFitScore(acc.tier, !!acc.target_revenue);
      const engagement = calcEngagementScore(committeeSize, companyDealsData.total, committeeInteractions);
      const intent = calcIntentScore(committeeInteractions, companyDealsData.open > 0);
      const influence = calcInfluenceScore(committeeSize, hasChampion, hasDecisionMaker);

      const total = Math.min(100, fit + engagement + intent + influence);
      const breakdown: ScoreBreakdown = { fit, engagement, intent, influence };

      returnUpdates.push({ id: acc.id, account_score: total, score_breakdown: breakdown });
      upsertRows.push({ id: acc.id, user_id: acc.user_id, account_score: total, score_breakdown: breakdown, last_scored_at: now });
    }

    // Bulk-update all accounts in a single upsert
    if (upsertRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from("abm_accounts")
        .upsert(upsertRows, { onConflict: "id" });
      if (upsertErr) {
        log.error("bulk_update_accounts_failed", { error: upsertErr.message });
      }
    }

    log.info("scoring_complete", { count: returnUpdates.length });
    return jsonOk({ scored: returnUpdates.length, accounts: returnUpdates, traceId }, req);
  } catch (err) {
    log.error("fatal_error", { error: err instanceof Error ? err.message : String(err) });
    return jsonError("Internal server error", 500, req);
  }
});
