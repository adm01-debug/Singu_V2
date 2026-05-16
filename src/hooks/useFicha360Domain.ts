import { useMemo } from 'react';
import { computeProntidaoScore } from '@/domain/leadScoring';
import { applySimulation } from '@/domain/forecastSimulation';
import { computeProntidaoTrend } from '@/domain/churnRisk';
import { computeProximosPassos } from '@/domain/nextStepLogic';

interface UseFicha360DomainProps {
  profile: any;
  intelligence: any;
  weights: any;
  simEnabled: boolean;
  simOverrides: any;
  recentInteractions: any[];
  trendWeeks: number;
  rapportIntel: any;
  passoFeedbacks: any[];
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
        weeks: trendWeeks as any,
      }),
    [recentInteractions, effectiveProfile, effectiveIntel, weights, trendWeeks]
  );

  const feedbackHints = useMemo(() => {
    const seen = new Set<string>();
    const hints: any[] = [];
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