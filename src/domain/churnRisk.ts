/**
 * Reconstrução da tendência semanal do Score de Prontidão a partir do histórico
 * de interações já carregado no client. Função pura, zero rede.
 */
import {
  computeProntidaoScore,
  type ProntidaoLevel,
  type ProntidaoWeights,
} from './prontidaoScore';
import type { ExternalInteraction } from '@/hooks/useExternalInteractions';

interface ProfileLike {
  cadence_days?: number | null;
  last_contact_at?: string | null;
  sentiment?: string | null;
}

interface IntelligenceLike {
  sentiment?: string | null;
  best_channel?: string | null;
  best_time?: string | null;
}

/**
 * Contribuição ponderada de cada fator para o score da semana.
 * cadence + recency + sentiment + channel ≈ score (arredondamentos podem causar ±1).
 */
export interface ProntidaoFactorContribution {
  cadence: number;
  recency: number;
  sentiment: number;
  channel: number;
}

export interface ProntidaoTrendPoint {
  weekStart: string; // ISO yyyy-MM-dd (segunda-feira)
  weekEnd: string; // ISO yyyy-MM-dd (domingo)
  weekLabel: string; // "12/05"
  score: number;
  level: ProntidaoLevel;
  levelLabel: string;
  interactionCount: number;
  hasData: boolean;
  /** Decomposição ponderada (somam ≈ score). Ausente quando hasData=false. */
  contribution?: ProntidaoFactorContribution;
}

interface ComputeTrendArgs {
  interactions: ExternalInteraction[];
  profile: ProfileLike | null | undefined;
  intelligence: IntelligenceLike | null | undefined;
  weights?: ProntidaoWeights;
  weeks?: number;
}

/** Segunda-feira da semana de uma data (00:00 local). */
function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay(); // 0=Dom..6=Sab
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  return out;
}

function endOfWeek(monday: Date): Date {
  const out = new Date(monday);
  out.setDate(out.getDate() + 6);
  out.setHours(23, 59, 59, 999);
  return out;
}

function fmtIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtLabel(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${m}`;
}

function refDate(it: ExternalInteraction): number | null {
  const ref = it.data_interacao || it.created_at;
  if (!ref) return null;
  const t = new Date(ref).getTime();
  return Number.isFinite(t) ? t : null;
}

export function computeProntidaoTrend({
  interactions,
  profile,
  intelligence,
  weights,
  weeks = 8,
}: ComputeTrendArgs): ProntidaoTrendPoint[] {
  const list = Array.isArray(interactions) ? interactions : [];

  // Pré-ordenar por data ascendente (mais antigo primeiro)
  const sorted = [...list]
    .map((it) => ({ it, t: refDate(it) }))
    .filter((x): x is { it: ExternalInteraction; t: number } => x.t != null)
    .sort((a, b) => a.t - b.t);

  const todayMonday = startOfWeek(new Date());
  const points: ProntidaoTrendPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const wStart = new Date(todayMonday);
    wStart.setDate(wStart.getDate() - i * 7);
    const wEnd = endOfWeek(wStart);
    const wEndMs = wEnd.getTime();

    // Interações até o fim da semana
    const upTo = sorted.filter((x) => x.t <= wEndMs);
    const inWeek = sorted.filter(
      (x) => x.t >= wStart.getTime() && x.t <= wEndMs,
    );

    const last = upTo[upTo.length - 1];
    const lastSentiment = (() => {
      for (let j = upTo.length - 1; j >= 0; j--) {
        const s = (upTo[j].it.status || '').toLowerCase();
        if (s.includes('pos') || s.includes('neg') || s.includes('mix') || s.includes('neu')) {
          return upTo[j].it.status as string;
        }
      }
      return profile?.sentiment ?? intelligence?.sentiment ?? null;
    })();

    const hasData = upTo.length > 0;

    if (!hasData) {
      points.push({
        weekStart: fmtIso(wStart),
        weekEnd: fmtIso(wEnd),
        weekLabel: fmtLabel(wStart),
        score: 0,
        level: 'frio',
        levelLabel: 'Sem dados',
        interactionCount: 0,
        hasData: false,
      });
      continue;
    }

    const syntheticProfile: ProfileLike = {
      cadence_days: profile?.cadence_days ?? null,
      last_contact_at: last
        ? new Date(last.t).toISOString()
        : profile?.last_contact_at ?? null,
      sentiment: lastSentiment,
    };

    // Recalcular usando "agora" = wEnd: como computeProntidaoScore usa Date.now(),
    // ajustamos last_contact_at para refletir a "idade" daquela semana.
    // Truque: subtrair (now - wEndMs) do last_contact_at para preservar o cálculo de daysSince.
    const offset = Date.now() - wEndMs;
    if (syntheticProfile.last_contact_at) {
      const lt = new Date(syntheticProfile.last_contact_at).getTime();
      syntheticProfile.last_contact_at = new Date(lt + offset).toISOString();
    }

    const result = computeProntidaoScore({
      profile: syntheticProfile,
      intelligence: intelligence ?? null,
      weights,
    });

    const b = result.breakdown;
    const totalW =
      b.cadence.weight + b.recency.weight + b.sentiment.weight + b.channel.weight;
    const contribution: ProntidaoFactorContribution = totalW > 0
      ? {
          cadence: Math.round((b.cadence.score * b.cadence.weight) / totalW),
          recency: Math.round((b.recency.score * b.recency.weight) / totalW),
          sentiment: Math.round((b.sentiment.score * b.sentiment.weight) / totalW),
          channel: Math.round((b.channel.score * b.channel.weight) / totalW),
        }
      : { cadence: 0, recency: 0, sentiment: 0, channel: 0 };

    points.push({
      weekStart: fmtIso(wStart),
      weekEnd: fmtIso(wEnd),
      weekLabel: fmtLabel(wStart),
      score: result.score,
      level: result.level,
      levelLabel: result.levelLabel,
      interactionCount: inWeek.length,
      hasData: true,
      contribution,
    });
  }

  return points;
}

/** Slope linear simples (mínimos quadrados) para os últimos N pontos com dados. */
export function computeTrendSlope(points: ProntidaoTrendPoint[], n = 4): number {
  const valid = points.filter((p) => p.hasData).slice(-n);
  if (valid.length < 2) return 0;
  const xs = valid.map((_, i) => i);
  const ys = valid.map((p) => p.score);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export type TrendDirection = 'up' | 'flat' | 'down';

export function classifyTrend(slope: number): TrendDirection {
  if (slope >= 2) return 'up';
  if (slope <= -2) return 'down';
  return 'flat';
}
