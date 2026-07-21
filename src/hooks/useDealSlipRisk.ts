import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PipelineDeal } from '@/hooks/usePipeline';
import { useAuth } from '@/hooks/useAuth';
import {
  STAGE_BENCHMARK_DAYS,
  DEAL_RISK_LOOKBACK_DAYS,
  DEAL_ENGAGEMENT_GAP_DAYS,
  sentimentValue,
  clamp,
  levelFromScore,
} from '@/lib/deal-risk-constants';

export type RiskLevel = 'healthy' | 'attention' | 'high';

export interface RiskFactor {
  key: 'stagnation' | 'sentiment' | 'engagement' | 'age';
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  detail: string;
}

export interface DealRiskResult {
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  recommendations: string[];
}

interface SignalPayload {
  recentSentiments: Array<{ sentiment: string | null; created_at: string }>;
  lastInboundAt: string | null;
}

export function useDealSlipRisk(deal: PipelineDeal | null | undefined) {
  const { user } = useAuth();
  const enabled = !!deal?.contact_id && !!user;

  const { data: signals } = useQuery<SignalPayload>({
    queryKey: ['deal-slip-signals', user?.id, deal?.contact_id],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - DEAL_RISK_LOOKBACK_DAYS);

      const { data: interactions } = await supabase
        .from('interactions')
        .select('sentiment, created_at, initiated_by')
        .eq('contact_id', deal!.contact_id!)
        .eq('user_id', user!.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      const list = interactions ?? [];
      const recentSentiments = list.slice(0, 5).map((r) => ({
        sentiment: r.sentiment,
        created_at: r.created_at,
      }));
      const inbound = list.find((r) => {
        const by = (r.initiated_by ?? '').toLowerCase();
        return by === 'contact' || by === 'cliente' || by === 'inbound';
      });
      return {
        recentSentiments,
        lastInboundAt: inbound?.created_at ?? null,
      };
    },
  });

  return useMemo<DealRiskResult>(() => {
    if (!deal) {
      return { score: 0, level: 'healthy', factors: [], recommendations: [] };
    }

    const stage = deal.pipeline_stage || 'lead';
    const benchmark = STAGE_BENCHMARK_DAYS[stage] ?? 14;
    const daysInStage = deal.dias_no_estagio_atual ?? 0;

    // 1) Stagnation
    const stagnationRatio = daysInStage / benchmark;
    const stagnationScore = clamp(((stagnationRatio - 1) / 2) * 100);

    // 2) Sentiment decay
    const sentiments = signals?.recentSentiments ?? [];
    const avgSent =
      sentiments.length > 0
        ? sentiments.reduce((a, b) => a + sentimentValue(b.sentiment), 0) / sentiments.length
        : 0;
    const sentimentScore = clamp(((-avgSent + 1) / 2) * 100);

    // 3) Engagement gap (dias sem inbound)
    const lastInbound = signals?.lastInboundAt ? new Date(signals.lastInboundAt) : null;
    const daysSinceInbound = lastInbound
      ? Math.floor((Date.now() - lastInbound.getTime()) / (1000 * 60 * 60 * 24))
      : DEAL_RISK_LOOKBACK_DAYS;
    const engagementScore = clamp((daysSinceInbound / DEAL_ENGAGEMENT_GAP_DAYS) * 100);

    // 4) Age vs benchmark
    const createdAt = deal.created_at ? new Date(deal.created_at) : new Date();
    const totalAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const ageScore = clamp(((totalAge / DEAL_RISK_LOOKBACK_DAYS) - 0.5) * 100);

    const factors: RiskFactor[] = [
      {
        key: 'stagnation',
        label: 'Estagnação no estágio',
        score: Math.round(stagnationScore),
        weight: 0.4,
        detail: `${daysInStage}d no estágio (esperado: ${benchmark}d)`,
      },
      {
        key: 'sentiment',
        label: 'Tendência de sentimento',
        score: Math.round(sentimentScore),
        weight: 0.25,
        detail:
          sentiments.length > 0
            ? `Média ${avgSent.toFixed(2)} nas últimas ${sentiments.length} interações`
            : 'Sem interações recentes',
      },
      {
        key: 'engagement',
        label: 'Gap de engajamento',
        score: Math.round(engagementScore),
        weight: 0.25,
        detail: lastInbound
          ? `${daysSinceInbound}d sem resposta do contato`
          : `Nenhuma resposta inbound em ${DEAL_RISK_LOOKBACK_DAYS}d`,
      },
      {
        key: 'age',
        label: 'Idade vs ciclo médio',
        score: Math.round(ageScore),
        weight: 0.1,
        detail: `${totalAge}d de idade (ciclo médio: ${DEAL_RISK_LOOKBACK_DAYS}d)`,
      },
    ];

    const total = Math.round(
      factors.reduce((a, f) => a + f.score * f.weight, 0)
    );

    const level = levelFromScore(total);
    const recommendations: string[] = [];

    if (stagnationScore > 50) {
      recommendations.push(`Mover deal: está ${daysInStage - benchmark}d acima do esperado para "${stage}".`);
    }
    if (sentimentScore > 50) {
      recommendations.push('Agendar call de alinhamento — sentimento em queda nas últimas interações.');
    }
    if (engagementScore > 50) {
      recommendations.push('Re-engajar com mensagem personalizada (vídeo curto ou case relevante).');
    }
    if (ageScore > 50 && level === 'high') {
      recommendations.push('Considerar disqualify ou pausar para foco em deals quentes.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Deal saudável — manter cadência atual e avançar para próximo passo.');
    }

    return { score: total, level, factors, recommendations };
  }, [deal, signals]);
}
