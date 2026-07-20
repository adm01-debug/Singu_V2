// Lead Scorer — calcula score server-side com decay temporal por dimensão.
// Modos: { contact_id } -> recalcula 1, { batch: true, limit?: n } -> processa fila.
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuth, jsonOk, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 60 });

interface Rule {
  dimension: string;
  signal_key: string;
  weight: number;
  decay_days: number;
  active: boolean;
}
interface Threshold { grade: string; min_score: number; }

const DAY_MS = 86_400_000;

function decayFactor(ageDays: number, halfLifeDays: number): number {
  if (halfLifeDays <= 0) return 1;
  return Math.exp(-Math.LN2 * (ageDays / halfLifeDays));
}

function gradeFor(score: number, thresholds: Threshold[]): string {
  const sorted = [...thresholds].sort((a, b) => b.min_score - a.min_score);
  for (const t of sorted) if (score >= t.min_score) return t.grade;
  return 'D';
}

async function ensureDefaults(supabase: ReturnType<typeof createClient>, userId: string) {
  const { count } = await supabase
    .from('lead_score_thresholds').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  if (!count || count === 0) {
    await supabase.rpc('seed_lead_score_defaults', { _user_id: userId });
  }
}

async function computeForContact(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  contactId: string,
  rules: Rule[],
  thresholds: Threshold[],
) {
  const now = Date.now();
  const since60d = new Date(now - 60 * DAY_MS).toISOString();
  const ruleMap = new Map(rules.filter(r => r.active).map(r => [`${r.dimension}:${r.signal_key}`, r]));
  const dimScores: Record<string, number> = { fit: 0, engagement: 0, intent: 0, relationship: 0 };

  // Parallelize all 4 independent reads
  const [
    { data: contact },
    { data: interactions },
    { data: signals },
    { data: prev },
  ] = await Promise.all([
    supabase.from('contacts')
      .select('id, email, phone, role_title, company_id, relationship_score')
      .eq('id', contactId).eq('user_id', userId).maybeSingle(),
    supabase.from('interactions').select('id, created_at')
      .eq('contact_id', contactId).eq('user_id', userId).gte('created_at', since60d),
    supabase.from('intent_signals').select('signal_type, weight, occurred_at')
      .eq('contact_id', contactId).eq('user_id', userId).gte('occurred_at', since60d),
    supabase.from('lead_scores').select('total_score, grade')
      .eq('user_id', userId).eq('contact_id', contactId).maybeSingle(),
  ]);

  if (!contact) return null;

  // 1. Contact attributes (fit)
  const fitChecks: Array<[string, boolean]> = [
    ['company_present', !!contact.company_id],
    ['role_present', !!contact.role_title],
    ['email_present', !!contact.email],
    ['phone_present', !!contact.phone],
  ];
  for (const [key, ok] of fitChecks) {
    if (!ok) continue;
    const r = ruleMap.get(`fit:${key}`);
    if (r) dimScores.fit += Number(r.weight);
  }

  // 2. Interactions (engagement) with decay
  const intRule = ruleMap.get('engagement:interaction');
  const recentRule = ruleMap.get('engagement:recent_interaction_7d');
  for (const i of interactions ?? []) {
    const ageDays = (now - new Date(i.created_at).getTime()) / DAY_MS;
    if (intRule) dimScores.engagement += Number(intRule.weight) * decayFactor(ageDays, intRule.decay_days);
    if (recentRule && ageDays <= 7) dimScores.engagement += Number(recentRule.weight) * decayFactor(ageDays, recentRule.decay_days);
  }

  // 3. Intent signals
  for (const s of signals ?? []) {
    const r = ruleMap.get(`intent:${s.signal_type}`);
    if (!r) continue;
    const ageDays = (now - new Date(s.occurred_at).getTime()) / DAY_MS;
    dimScores.intent += Number(r.weight) * Number(s.weight ?? 1) * decayFactor(ageDays, r.decay_days);
  }

  // 4. Relationship
  const relRule = ruleMap.get('relationship:relationship_score');
  if (relRule && contact.relationship_score != null) {
    dimScores.relationship = Number(contact.relationship_score) * Number(relRule.weight);
  }

  // Cap per dimension at 100
  for (const k of Object.keys(dimScores)) dimScores[k] = Math.min(100, Math.max(0, dimScores[k]));
  const total = Math.round(((dimScores.fit + dimScores.engagement + dimScores.intent + dimScores.relationship) / 4) * 100) / 100;
  const grade = gradeFor(total, thresholds);

  const prevScore = Number(prev?.total_score ?? 0);
  const change = total - prevScore;

  const nowIso = new Date().toISOString();
  const upsertData = {
    user_id: userId,
    contact_id: contactId,
    fit_score: dimScores.fit,
    engagement_score: dimScores.engagement,
    intent_score: dimScores.intent,
    relationship_score: dimScores.relationship,
    total_score: total,
    grade,
    score_change: change,
    previous_score: prevScore,
    last_calculated_at: nowIso,
    computed_at: nowIso,
    decay_applied_at: nowIso,
  };

  const shouldSnapshot = !prev || prev.grade !== grade || Math.abs(change) >= 10;

  // Parallelize upsert + optional history insert
  await Promise.all([
    supabase.from('lead_scores').upsert(upsertData, { onConflict: 'user_id,contact_id' }),
    shouldSnapshot
      ? supabase.from('lead_score_history').insert({
          user_id: userId,
          contact_id: contactId,
          total_score: total,
          grade,
          engagement_score: dimScores.engagement,
          fit_score: dimScores.fit,
          intent_score: dimScores.intent,
          relationship_score: dimScores.relationship,
          breakdown: { dimensions: dimScores, signals_count: signals?.length ?? 0, interactions_count: interactions?.length ?? 0 },
        })
      : Promise.resolve(),
  ]);

  // Disparar threshold runner se grade mudou OU score cruzou múltiplo de 10
  const crossedScore = Math.floor(prevScore / 10) !== Math.floor(total / 10);
  if (!prev || prev.grade !== grade || crossedScore) {
    try {
      await supabase.functions.invoke('lead-score-threshold-runner', {
        body: {
          user_id: userId,
          contact_id: contactId,
          from_grade: prev?.grade ?? null,
          to_grade: grade,
          from_score: prevScore,
          to_score: total,
        },
      });
    } catch (e) {
      console.error('threshold-runner invoke failed', e);
    }
  }

  return { contact_id: contactId, total, grade, change, dimensions: dimScores };
}

Deno.serve(async (req: Request) => {
  const cors = handleCorsAndMethod(req);
  if (cors) return cors;

  const auth = await withAuth(req);
  if (auth instanceof Response) return auth;
  const userId = auth;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;
  const body = (rawBody ?? {}) as { contact_id?: string; batch?: boolean; limit?: number };

  await ensureDefaults(supabase, userId);

  const [{ data: rules }, { data: thresholds }] = await Promise.all([
    supabase.from('lead_score_rules').select('dimension, signal_key, weight, decay_days, active').eq('user_id', userId),
    supabase.from('lead_score_thresholds').select('grade, min_score').eq('user_id', userId),
  ]);

  const r = (rules ?? []) as Rule[];
  const t = (thresholds ?? []) as Threshold[];

  if (body.contact_id) {
    const result = await computeForContact(supabase, userId, body.contact_id, r, t);
    return jsonOk({ ok: true, result }, req);
  }

  // Batch — processa fila com pré-busca em bloco para eliminar N+1
  const limit = Math.min(Math.max(1, body.limit ?? 50), 200);
  const { data: queue } = await supabase
    .from('lead_score_recompute_queue')
    .select('id, contact_id')
    .eq('user_id', userId).is('processed_at', null)
    .order('enqueued_at', { ascending: true })
    .limit(limit);

  const queueItems = queue ?? [];
  if (queueItems.length === 0) {
    return jsonOk({ ok: true, processed: 0, results: [] }, req);
  }

  const batchContactIds = queueItems.map(q => q.contact_id as string);
  const nowMs = Date.now();
  const since60d = new Date(nowMs - 60 * DAY_MS).toISOString();

  // Pre-fetch all data for all queue items in 4 parallel queries
  const [
    { data: batchContacts },
    { data: batchInteractions },
    { data: batchSignals },
    { data: batchPrevScores },
  ] = await Promise.all([
    supabase.from('contacts')
      .select('id, email, phone, role_title, company_id, relationship_score')
      .eq('user_id', userId).in('id', batchContactIds),
    supabase.from('interactions').select('id, contact_id, created_at')
      .eq('user_id', userId).in('contact_id', batchContactIds).gte('created_at', since60d),
    supabase.from('intent_signals').select('signal_type, weight, occurred_at, contact_id')
      .eq('user_id', userId).in('contact_id', batchContactIds).gte('occurred_at', since60d),
    supabase.from('lead_scores').select('contact_id, total_score, grade')
      .eq('user_id', userId).in('contact_id', batchContactIds),
  ]);

  // Build lookup Maps for O(1) per-item access
  const contactMap = new Map((batchContacts ?? []).map(c => [c.id, c]));
  const interactionsByContact = new Map<string, typeof batchInteractions extends (infer T)[] | null ? T[] : never[]>();
  for (const i of batchInteractions ?? []) {
    if (!interactionsByContact.has(i.contact_id)) interactionsByContact.set(i.contact_id, []);
    interactionsByContact.get(i.contact_id)!.push(i);
  }
  const signalsByContact = new Map<string, typeof batchSignals extends (infer T)[] | null ? T[] : never[]>();
  for (const s of batchSignals ?? []) {
    const cid = (s as Record<string, unknown>).contact_id as string;
    if (!signalsByContact.has(cid)) signalsByContact.set(cid, []);
    signalsByContact.get(cid)!.push(s);
  }
  const prevScoreMap = new Map((batchPrevScores ?? []).map(p => [p.contact_id as string, p]));

  const ruleMap = new Map(r.filter(rule => rule.active).map(rule => [`${rule.dimension}:${rule.signal_key}`, rule]));

  // Accumulators
  const upsertRows: Record<string, unknown>[] = [];
  const historyRows: Record<string, unknown>[] = [];
  type ThresholdPayload = { user_id: string; contact_id: string; from_grade: string | null; to_grade: string; from_score: number; to_score: number };
  const thresholdPayloads: ThresholdPayload[] = [];
  const results: unknown[] = [];
  const nowIso = new Date(nowMs).toISOString();

  for (const q of queueItems) {
    try {
      const contactId = q.contact_id as string;
      const contact = contactMap.get(contactId);
      if (!contact) continue;

      const interactions = (interactionsByContact.get(contactId) ?? []) as Array<{ created_at: string }>;
      const signals = (signalsByContact.get(contactId) ?? []) as Array<{ signal_type: string; weight: unknown; occurred_at: string }>;
      const prev = prevScoreMap.get(contactId) as { total_score: number; grade: string } | undefined;

      const dimScores: Record<string, number> = { fit: 0, engagement: 0, intent: 0, relationship: 0 };

      // 1. Contact attributes (fit)
      const fitChecks: Array<[string, boolean]> = [
        ['company_present', !!contact.company_id],
        ['role_present', !!contact.role_title],
        ['email_present', !!contact.email],
        ['phone_present', !!contact.phone],
      ];
      for (const [key, ok] of fitChecks) {
        if (!ok) continue;
        const rule = ruleMap.get(`fit:${key}`);
        if (rule) dimScores.fit += Number(rule.weight);
      }

      // 2. Interactions (engagement) with decay
      const intRule = ruleMap.get('engagement:interaction');
      const recentRule = ruleMap.get('engagement:recent_interaction_7d');
      for (const i of interactions) {
        const ageDays = (nowMs - new Date(i.created_at).getTime()) / DAY_MS;
        if (intRule) dimScores.engagement += Number(intRule.weight) * decayFactor(ageDays, intRule.decay_days);
        if (recentRule && ageDays <= 7) dimScores.engagement += Number(recentRule.weight) * decayFactor(ageDays, recentRule.decay_days);
      }

      // 3. Intent signals
      for (const s of signals) {
        const rule = ruleMap.get(`intent:${s.signal_type}`);
        if (!rule) continue;
        const ageDays = (nowMs - new Date(s.occurred_at).getTime()) / DAY_MS;
        dimScores.intent += Number(rule.weight) * Number(s.weight ?? 1) * decayFactor(ageDays, rule.decay_days);
      }

      // 4. Relationship
      const relRule = ruleMap.get('relationship:relationship_score');
      if (relRule && contact.relationship_score != null) {
        dimScores.relationship = Number(contact.relationship_score) * Number(relRule.weight);
      }

      for (const k of Object.keys(dimScores)) dimScores[k] = Math.min(100, Math.max(0, dimScores[k]));
      const total = Math.round(((dimScores.fit + dimScores.engagement + dimScores.intent + dimScores.relationship) / 4) * 100) / 100;
      const grade = gradeFor(total, t);
      const prevScore = Number(prev?.total_score ?? 0);
      const change = total - prevScore;

      upsertRows.push({
        user_id: userId,
        contact_id: contactId,
        fit_score: dimScores.fit,
        engagement_score: dimScores.engagement,
        intent_score: dimScores.intent,
        relationship_score: dimScores.relationship,
        total_score: total,
        grade,
        score_change: change,
        previous_score: prevScore,
        last_calculated_at: nowIso,
        computed_at: nowIso,
        decay_applied_at: nowIso,
      });

      const shouldSnapshot = !prev || prev.grade !== grade || Math.abs(change) >= 10;
      if (shouldSnapshot) {
        historyRows.push({
          user_id: userId,
          contact_id: contactId,
          total_score: total,
          grade,
          engagement_score: dimScores.engagement,
          fit_score: dimScores.fit,
          intent_score: dimScores.intent,
          relationship_score: dimScores.relationship,
          breakdown: { dimensions: dimScores, signals_count: signals.length, interactions_count: interactions.length },
        });
      }

      const crossedScore = Math.floor(prevScore / 10) !== Math.floor(total / 10);
      if (!prev || prev.grade !== grade || crossedScore) {
        thresholdPayloads.push({
          user_id: userId,
          contact_id: contactId,
          from_grade: prev?.grade ?? null,
          to_grade: grade,
          from_score: prevScore,
          to_score: total,
        });
      }

      results.push({ contact_id: contactId, total, grade, change, dimensions: dimScores });
    } catch (e) {
      console.error('lead-scorer batch item error', q.id, e);
    }
  }

  // Bulk-flush all writes after the loop
  await Promise.all([
    upsertRows.length > 0
      ? supabase.from('lead_scores').upsert(upsertRows, { onConflict: 'user_id,contact_id' })
      : Promise.resolve(),
    historyRows.length > 0
      ? supabase.from('lead_score_history').insert(historyRows)
      : Promise.resolve(),
    queueItems.length > 0
      ? supabase.from('lead_score_recompute_queue')
          .update({ processed_at: nowIso })
          .in('id', queueItems.map(q => q.id))
      : Promise.resolve(),
  ]);

  // Fire threshold-runner invocations in parallel (after DB writes)
  if (thresholdPayloads.length > 0) {
    await Promise.allSettled(
      thresholdPayloads.map(payload =>
        supabase.functions.invoke('lead-score-threshold-runner', { body: payload })
      )
    );
  }

  return jsonOk({ ok: true, processed: results.length, results }, req);
});
