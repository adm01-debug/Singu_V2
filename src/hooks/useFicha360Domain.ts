import { useMemo } from 'react';
import { computeProntidaoScore } from '@/domain/leadScoring';
import { applySimulation } from '@/domain/forecastSimulation';
import { computeProntidaoTrend } from '@/domain/churnRisk';
import { computeProximosPassos } from '@/domain/nextStepLogic';

type UnknownRecord = Record<string, unknown>;
type TrendWeeks = 4 | 8 | 12;

interface PassoFeedback {
  passo_id: string;
  outcome: string;
  executed_at: string;
}

interface FeedbackHint {
  passoId: string;
  lastOutcome: string;
  daysAgo: number;
}

interface UseFicha360DomainProps {
  profile: UnknownRecord | null | undefined;
  intelligence: UnknownRecord | null | undefined;
  weights: UnknownRecord | null | undefined;
  simEnabled: boolean;
  simOverrides: UnknownRecord | null | undefined;
  recentInteractions: UnknownRecord[];
  trendWeeks: number;
  rapportIntel: { birthday?: string | null } | null | undefined;
  passoFeedbacks: PassoFeedback[];
}

export function useFicha360Domain({
  profile,
  intelligence,
  weights,
  simEnabled,
  simOverrides,
  recentInteractions,
  trendWeeks,
  rapportIntel,
  passoFeedbacks
}: UseFicha360DomainProps) {
  const realProntidao = useMemo(
    () => computeProntidaoScore({ profile, intelligence, weights }),
    [profile, intelligence, weights]
  );

  const { profile: effectiveProfile, intelligence: effectiveIntel } = useMemo(() => {
    if (!simEnabled) return { profile, intelligence };
    return applySimulation(profile, intelligence, simOverrides);
  }, [simEnabled, simOverrides, profile, intelligence]);

  const prontidao = useMemo(
    () =>
      computeProntidaoScore({
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        weights,
      }),
    [effectiveProfile, effectiveIntel, weights]
  );

  const trend = useMemo(
    () =>
      computeProntidaoTrend({
        interactions: recentInteractions,
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        weights,
        weeks: trendWeeks as TrendWeeks,
      }),
    [recentInteractions, effectiveProfile, effectiveIntel, weights, trendWeeks]
  );

  const feedbackHints = useMemo(() => {
    const seen = new Set<string>();
    const hints: FeedbackHint[] = [];
    for (const f of passoFeedbacks) {
      if (seen.has(f.passo_id)) continue;
      seen.add(f.passo_id);
      const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(f.executed_at).getTime()) / 86400000));
      hints.push({ passoId: f.passo_id, lastOutcome: f.outcome, daysAgo });
    }
    return hints;
  }, [passoFeedbacks]);

  const passos = useMemo(
    () =>
      computeProximosPassos({
        profile: effectiveProfile,
        intelligence: effectiveIntel,
        recentInteractions,
        prontidao,
        birthday: rapportIntel?.birthday ?? null,
        email: typeof effectiveIntel?.email === 'string' ? effectiveIntel.email : null,
        feedbackHints,
      }),
    [effectiveProfile, effectiveIntel, recentInteractions, prontidao, rapportIntel, feedbackHints]
  );

  return {
    realProntidao,
    effectiveProfile,
    effectiveIntel,
    prontidao,
    trend,
    passos,
    simEnabled
  };
}