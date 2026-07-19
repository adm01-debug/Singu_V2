import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuthOrServiceRole, isServiceRoleCaller, jsonError, jsonOk, handleCorsAndMethod } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

interface SignalRow {
  contact_id: string | null;
  external_company_id: string | null;
  signal_type: string;
  weight: number;
  occurred_at: string;
}

Deno.serve(async (req) => {
  const cors = handleCorsAndMethod(req);
  if (cors) return cors;

  const auth = await withAuthOrServiceRole(req);
  if (auth instanceof Response) return auth;

  if (!isServiceRoleCaller(auth)) {
    const rl = limiter.check(auth, req);
    if (rl) return rl;
  }

  let targetUserId: string;
  if (isServiceRoleCaller(auth)) {
    try {
      const body = await req.json();
      if (!body?.user_id || typeof body.user_id !== "string") {
        return jsonError("user_id required for service-role calls", 400, req);
      }
      targetUserId = body.user_id;
    } catch {
      return jsonError("Invalid JSON body", 400, req);
    }
  } else {
    targetUserId = auth;
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: signals, error } = await admin
    .from("intent_signals")
    .select("contact_id, external_company_id, signal_type, weight, occurred_at")
    .eq("user_id", targetUserId)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("intent-aggregator fetch", error);
    return jsonError("Fetch failed", 500, req);
  }

  const rows = (signals as SignalRow[] | null) ?? [];
  const contactBuckets = new Map<string, SignalRow[]>();
  const accountBuckets = new Map<string, SignalRow[]>();

  for (const r of rows) {
    if (r.contact_id) {
      const arr = contactBuckets.get(r.contact_id) ?? [];
      arr.push(r); contactBuckets.set(r.contact_id, arr);
    }
    if (r.external_company_id) {
      const arr = accountBuckets.get(r.external_company_id) ?? [];
      arr.push(r); accountBuckets.set(r.external_company_id, arr);
    }
  }

  const upserts: Array<{
    user_id: string; scope: "contact" | "account"; scope_id: string;
    intent_score: number; score_trend: "rising" | "stable" | "falling";
    signal_count_30d: number; top_signals: unknown; computed_at: string;
  }> = [];

  const now = new Date();
  const midpoint = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).getTime();

  function compute(scope: "contact" | "account", id: string, items: SignalRow[]) {
    const totalWeight = items.reduce((s, r) => s + r.weight, 0);
    const score = Math.min(100, Math.round((totalWeight / 80) * 100));

    const recent = items.filter((r) => new Date(r.occurred_at).getTime() >= midpoint);
    const older = items.filter((r) => new Date(r.occurred_at).getTime() < midpoint);
    const recentW = recent.reduce((s, r) => s + r.weight, 0);
    const olderW = older.reduce((s, r) => s + r.weight, 0);
    const trend: "rising" | "stable" | "falling" =
      recentW > olderW * 1.2 ? "rising" : recentW < olderW * 0.8 ? "falling" : "stable";

    const typeAgg = new Map<string, number>();
    for (const r of items) typeAgg.set(r.signal_type, (typeAgg.get(r.signal_type) ?? 0) + r.weight);
    const top_signals = [...typeAgg.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([type, weight]) => ({ type, weight }));

    upserts.push({
      user_id: targetUserId, scope, scope_id: id,
      intent_score: score, score_trend: trend,
      signal_count_30d: items.length, top_signals,
      computed_at: now.toISOString(),
    });
  }

  for (const [id, items] of contactBuckets) compute("contact", id, items);
  for (const [id, items] of accountBuckets) compute("account", id, items);

  if (upserts.length > 0) {
    const { error: upErr } = await admin
      .from("intent_scores")
      .upsert(upserts, { onConflict: "user_id,scope,scope_id" });
    if (upErr) {
      console.error("intent-aggregator upsert", upErr);
      return jsonError("Upsert failed", 500, req);
    }
  }

  return jsonOk({
    ok: true,
    contacts_scored: contactBuckets.size,
    accounts_scored: accountBuckets.size,
    signals_processed: rows.length,
  }, req);
});
