import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineDeal } from '@/hooks/usePipeline';
import { useDealSlipRisk } from '@/hooks/useDealSlipRisk';
import { useAuth } from '@/hooks/useAuth';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ConfidenceFactor {
  key: 'stage' | 'slip' | 'momentum' | 'velocity';
  label: string;
  score: number; // 0-100
  weight: number;
  detail: string;
}

export interface DealForecastConfidence {
  confidence: number; // 0-100
  level: ConfidenceLevel;
  expectedCloseValue: number;
  factors: ConfidenceFactor[];
}

const STAGE_PROBABILITY: Record<string, number> = {
  lead: 10,
  primeiro_contato: 20,
  qualificacao: 30,
  proposta: 50,
  negociacao: 70,
  fechamento: 90,
};

const AVG_CYCLE_DAYS = 60;

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, n));

const levelFromConfidence = (c: number): ConfidenceLevel =>
  c >= 71 ? 'high' : c >= 41 ? 'medium' : 'low';

interface MomentumPayload {
  recentCount: number;
  previousCount: number;
}

export function useDealForecastConfidence(
  deal: PipelineDeal | null | undefined,
): DealForecastConfidence {
  const { user } = useAuth();
  const slip = useDealSlipRisk(deal);
  const enabled = !!deal?.contact_id && !!user;

  const { data: momentum } = useQuery<MomentumPayload>({
    queryKey: ['deal-momentum', user?.id, deal?.contact_id],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const now = Date.now();
      const since28 = new Date(now - 28 * 86400000).toISOString();
      const { data } = await supabase
        .from('interactions')
        .select('created_at')
        .eq('contact_id', deal!.contact_id!)
        .eq('user_id', user!.id)
        .gte('created_at', since28)
        .order('created_at', { ascending: false })
        .limit(200);

      const cutoff = now - 14 * 86400000;
      let recent = 0;
      let previous = 0;
      (data ?? []).forEach((r) => {
        const t = new Date(r.created_at).getTime();
        if (t >= cutoff) recent += 1;
        else previous += 1;
      });
      return { recentCount: recent, previousCount: previous };
    },
  });

  return useMemo<DealForecastConfidence>(() => {
    if (!deal) {
      return {
        confidence: 0,
        level: 'low',
        expectedCloseValue: 0,
        factors: [],
      };
    }

    const stage = deal.pipeline_stage || 'lead';
    const stageProb = STAGE_PROBABILITY[stage] ?? 20;

    // 1) Stage probability score
    const stageScore = stageProb;

    // 2) Slip risk invertido
    const slipInverted = clamp(100 - slip.score);

    // 3) Momentum
    const recent = momentum?.recentCount ?? 0;
    const previous = momentum?.previousCount ?? 0;
    let momentumScore: number;
    if (recent === 0 && previous === 0) momentumScore = 30;
    else if (previous === 0) momentumScore = clamp(60 + recent * 8);
    else {
      const ratio = recent / previous;
      momentumScore = clamp(ratio * 50);
    }

    // 4) Velocity fit
    const totalAge = deal.created_at
      ? Math.floor(
          (Date.now() - new Date(deal.created_at).getTime()) / 86400000,
        )
      : 0;
    const ageRatio = totalAge / AVG_CYCLE_DAYS;
    const velocityScore =
      ageRatio <= 1 ? clamp(100 - ageRatio * 30) : clamp(70 - (ageRatio - 1) * 60);

    const factors: ConfidenceFactor[] = [
      {
        key: 'stage',
        label: 'Probabilidade do estágio',
        score: Math.round(stageScore),
        weight: 0.35,
        detail: `${stage} (${stageProb}% base)`,
      },
      {
        key: 'slip',
        label: 'Saúde do deal',
        score: Math.round(slipInverted),
        weight: 0.3,
        detail: `Slip risk: ${slip.score}/100`,
      },
      {
        key: 'momentum',
        label: 'Momentum (14d vs 14d)',
        score: Math.round(momentumScore),
        weight: 0.2,
        detail: `${recent} interações recentes vs ${previous} anteriores`,
      },
      {
        key: 'velocity',
        label: 'Idade vs ciclo médio',
        score: Math.round(velocityScore),
        weight: 0.15,
        detail: `${totalAge}d (ciclo médio: ${AVG_CYCLE_DAYS}d)`,
      },
    ];

    const confidence = Math.round(
      factors.reduce((a, f) => a + f.score * f.weight, 0),
    );
    const level = levelFromConfidence(confidence);
    const expectedCloseValue = (deal.valor || 0) * (confidence / 100);

    return { confidence, level, expectedCloseValue, factors };
  }, [deal, slip.score, momentum]);
}
