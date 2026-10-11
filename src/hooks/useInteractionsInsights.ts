import { useMemo } from "react";
import { useConversationAnalyses, type ConversationAnalysis, type SentimentOverall } from "./useConversationIntel";

export type Period = "7d" | "30d" | "90d";
export type TrendDirection = "up" | "stable" | "down";

export interface ThemeAggregate {
  label: string;
  category: string;
  count: number;
  mentions: number;
  examples: string[]; // interaction_ids
}

export interface ObjectionAggregate {
  objection: string;
  category: string;
  count: number;
  handled: number;
  unhandled: number;
  suggestedResponse?: string;
  examples: string[];
}

export interface InsightsKpis {
  totalAnalyzed: number;
  dominantSentiment: SentimentOverall | null;
  dominantPct: number;
  avgCoachingScore: number;
  unhandledObjections: number;
}

export interface SentimentTrendPoint {
  week: string;
  positive: number;
  neutral: number;
  negative: number;
  mixed: number;
  total: number;
  positivePct: number;
}

export interface SentimentTrendSummary {
  bestWeek: { week: string; positivePct: number } | null;
  worstWeek: { week: string; positivePct: number } | null;
  deltaPct: number;
  direction: TrendDirection;
  totalInteractions: number;
}

export interface ObjectionsTrendPoint {
  week: string;
  /** Ocorrências de objeção com `handled === false` no período. */
  critical: number;
  /** Ocorrências de objeção com `handled === true` (mencionadas mas tratadas). */
  attention: number;
  /** Total de ocorrências (critical + attention). */
  total: number;
  /** % de objeções não tratadas (risco). */
  riskPct: number;
}

export interface ObjectionsTrendSummary {
  /** Variação em pp do riskPct entre 2ª e 1ª metade do período. */
  deltaRiskPp: number;
  direction: TrendDirection;
  peakWeek: { week: string; critical: number } | null;
  lowWeek: { week: string; critical: number } | null;
  totalCritical: number;
  totalAttention: number;
}


const periodToDays: Record<Period, number> = { "7d": 7, "30d": 30, "90d": 90 };

function startOfWeekIso(d: Date): string {
  const dt = new Date(d);
  const day = dt.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // ISO week starts Monday
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function useInteractionsInsights(period: Period = "30d") {
  const days = periodToDays[period];
  const query = useConversationAnalyses({ days });

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const insights = useMemo(() => {
    const list: ConversationAnalysis[] = query.data ?? [];

    const total = list.length;

    // Sentiment distribution
    const sentCounts: Record<string, number> = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
    const sentBuckets: Record<SentimentOverall, string[]> = { positive: [], neutral: [], negative: [], mixed: [] };
    let scoreSum = 0;
    let scoreCount = 0;
    let unhandled = 0;

    for (const a of list) {
      if (a.sentiment_overall) {
        sentCounts[a.sentiment_overall] = (sentCounts[a.sentiment_overall] ?? 0) + 1;
        if (a.interaction_id) sentBuckets[a.sentiment_overall].push(a.interaction_id);
      }
      if (typeof a.coaching_score === "number") {
        scoreSum += a.coaching_score;
        scoreCount++;
      }
      if (Array.isArray(a.objections)) {
        for (const o of a.objections) if (!o.handled) unhandled++;
      }
    }

    const sentimentDistribution = (["positive", "neutral", "negative", "mixed"] as const).map((key) => ({
      key,
      count: sentCounts[key] ?? 0,
      pct: total ? Math.round(((sentCounts[key] ?? 0) / total) * 100) : 0,
    }));

    let dominant: SentimentOverall | null = null;
    let dominantCount = 0;
    for (const s of sentimentDistribution) {
      if (s.count > dominantCount) {
        dominantCount = s.count;
        dominant = s.key;
      }
    }

    // Sentiment trend by ISO week
    const trendMap = new Map<string, { week: string; positive: number; neutral: number; negative: number; mixed: number; total: number }>();
    for (const a of list) {
      if (!a.analyzed_at) continue;
      const week = startOfWeekIso(new Date(a.analyzed_at));
      const cur = trendMap.get(week) ?? { week, positive: 0, neutral: 0, negative: 0, mixed: 0, total: 0 };
      if (a.sentiment_overall) cur[a.sentiment_overall] += 1;
      cur.total += 1;
      trendMap.set(week, cur);
    }
    const sentimentTrend: SentimentTrendPoint[] = Array.from(trendMap.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((p) => ({
        ...p,
        positivePct: p.total > 0 ? Math.round((p.positive / p.total) * 100) : 0,
      }));

    // Trend summary: best/worst week + delta entre 2ª e 1ª metade
    let sentimentTrendSummary: SentimentTrendSummary = {
      bestWeek: null,
      worstWeek: null,
      deltaPct: 0,
      direction: "stable",
      totalInteractions: sentimentTrend.reduce((acc, p) => acc + p.total, 0),
    };
    if (sentimentTrend.length >= 2) {
      let best = sentimentTrend[0];
      let worst = sentimentTrend[0];
      for (const p of sentimentTrend) {
        if (p.positivePct > best.positivePct) best = p;
        if (p.positivePct < worst.positivePct) worst = p;
      }
      const mid = Math.floor(sentimentTrend.length / 2);
      const firstHalf = sentimentTrend.slice(0, mid);
      const secondHalf = sentimentTrend.slice(mid);
      const avg = (arr: SentimentTrendPoint[]) =>
        arr.length ? arr.reduce((a, p) => a + p.positivePct, 0) / arr.length : 0;
      const delta = Math.round(avg(secondHalf) - avg(firstHalf));
      const direction: TrendDirection = delta >= 5 ? "up" : delta <= -5 ? "down" : "stable";
      sentimentTrendSummary = {
        bestWeek: { week: best.week, positivePct: best.positivePct },
        worstWeek: { week: worst.week, positivePct: worst.positivePct },
        deltaPct: delta,
        direction,
        totalInteractions: sentimentTrendSummary.totalInteractions,
      };
    }

    // Themes
    const themeMap = new Map<string, ThemeAggregate>();
    for (const a of list) {
      if (!Array.isArray(a.topics)) continue;
      for (const t of a.topics) {
        if (!t?.label) continue;
        const key = normalize(t.label);
        const cur = themeMap.get(key) ?? { label: t.label, category: t.category ?? "other", count: 0, mentions: 0, examples: [] };
        cur.count += 1;
        cur.mentions += t.mentions ?? 1;
        if (cur.examples.length < 5 && a.interaction_id) cur.examples.push(a.interaction_id);
        themeMap.set(key, cur);
      }
    }
    const topThemes = Array.from(themeMap.values()).sort((a, b) => b.mentions - a.mentions).slice(0, 10);

    // Objections
    const objMap = new Map<string, ObjectionAggregate>();
    for (const a of list) {
      if (!Array.isArray(a.objections)) continue;
      for (const o of a.objections) {
        if (!o?.objection) continue;
        const key = normalize(o.objection);
        const cur = objMap.get(key) ?? {
          objection: o.objection,
          category: o.category ?? "outras",
          count: 0,
          handled: 0,
          unhandled: 0,
          suggestedResponse: o.suggested_response,
          examples: [],
        };
        cur.count += 1;
        if (o.handled) cur.handled += 1;
        else cur.unhandled += 1;
        if (!cur.suggestedResponse && o.suggested_response) cur.suggestedResponse = o.suggested_response;
        // Sem cap: o modal pagina/carrega incrementalmente os exemplos.
        if (a.interaction_id && !cur.examples.includes(a.interaction_id)) {
          cur.examples.push(a.interaction_id);
        }
        objMap.set(key, cur);
      }
    }
    const topObjections = Array.from(objMap.values()).sort((a, b) => b.count - a.count).slice(0, 8);

    // Objections trend by ISO week — separa "críticas" (não tratadas) de
    // "atenções" (tratadas mas mencionadas). Usado para detectar quando o
    // risco de bloqueio aumentou ou diminuiu.
    const objTrendMap = new Map<string, ObjectionsTrendPoint>();
    for (const a of list) {
      if (!Array.isArray(a.objections) || a.objections.length === 0) continue;
      const ts = a.analyzed_at ?? null;
      if (!ts) continue;
      const week = startOfWeekIso(new Date(ts));
      const cur = objTrendMap.get(week) ?? { week, critical: 0, attention: 0, total: 0, riskPct: 0 };
      for (const o of a.objections) {
        if (!o?.objection) continue;
        if (o.handled) cur.attention += 1;
        else cur.critical += 1;
        cur.total += 1;
      }
      objTrendMap.set(week, cur);
    }
    const objectionsTrend: ObjectionsTrendPoint[] = Array.from(objTrendMap.values())
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((p) => ({ ...p, riskPct: p.total > 0 ? Math.round((p.critical / p.total) * 100) : 0 }));

    // Summary do trend de objeções
    let objectionsTrendSummary: ObjectionsTrendSummary = {
      deltaRiskPp: 0,
      direction: "stable",
      peakWeek: null,
      lowWeek: null,
      totalCritical: 0,
      totalAttention: 0,
    };
    if (objectionsTrend.length >= 1) {
      let peak = objectionsTrend[0];
      let low = objectionsTrend[0];
      let totC = 0;
      let totA = 0;
      for (const p of objectionsTrend) {
        if (p.critical > peak.critical) peak = p;
        if (p.critical < low.critical) low = p;
        totC += p.critical;
        totA += p.attention;
      }
      let delta = 0;
      let direction: TrendDirection = "stable";
      if (objectionsTrend.length >= 2) {
        const mid = Math.floor(objectionsTrend.length / 2);
        const first = objectionsTrend.slice(0, mid);
        const second = objectionsTrend.slice(mid);
        const avg = (arr: ObjectionsTrendPoint[]) =>
          arr.length ? arr.reduce((a, p) => a + p.riskPct, 0) / arr.length : 0;
        delta = Math.round(avg(second) - avg(first));
        // Para risco, "up" = piora (mais crítico), "down" = melhora.
        direction = delta >= 5 ? "up" : delta <= -5 ? "down" : "stable";
      }
      objectionsTrendSummary = {
        deltaRiskPp: delta,
        direction,
        peakWeek: { week: peak.week, critical: peak.critical },
        lowWeek: { week: low.week, critical: low.critical },
        totalCritical: totC,
        totalAttention: totA,
      };
    }

    const kpis: InsightsKpis = {
      totalAnalyzed: total,
      dominantSentiment: dominant,
      dominantPct: total ? Math.round((dominantCount / total) * 100) : 0,
      avgCoachingScore: scoreCount ? Math.round(scoreSum / scoreCount) : 0,
      unhandledObjections: unhandled,
    };

    return { kpis, sentimentDistribution, sentimentTrend, sentimentTrendSummary, topThemes, topObjections, objectionsTrend, objectionsTrendSummary, list, sentimentBuckets: sentBuckets };
  }, [query.data]);

  return { ...insights, isLoading: query.isLoading, isError: query.isError, error: query.error };
}
