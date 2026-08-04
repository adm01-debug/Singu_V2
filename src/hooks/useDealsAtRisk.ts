import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDealsPipeline, type PipelineDeal } from '@/hooks/usePipeline';
import { useAuth } from '@/hooks/useAuth';
import {
  STAGE_BENCHMARK_DAYS,
  DEAL_RISK_LOOKBACK_DAYS,
  DEAL_ENGAGEMENT_GAP_DAYS,
  DEAL_RISK_HIGH_THRESHOLD,
  DEAL_RISK_ATTENTION_THRESHOLD,
  sentimentValue,
  clamp,
} from '@/lib/deal-risk-constants';

export interface DealAtRisk {
  deal: PipelineDeal;
  score: number;
  level: 'healthy' | 'attention' | 'high';
  topFactor: string;
}

export function useDealsAtRisk(limit = 5) {
  const { user } = useAuth();
  const { data: deals } = useDealsPipeline();

  return useQuery<DealAtRisk[]>({
    queryKey: ['deals-at-risk', deals?.map((d) => d.id).join(','), user?.id],
    enabled: !!deals && deals.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const open = (deals ?? []).filter(
        (d) => d.status !== 'ganho' && d.status !== 'perdido'
      );
      if (open.length === 0) return [];

      const contactIds = Array.from(
        new Set(open.map((d) => d.contact_id).filter(Boolean) as string[])
      );

      const since = new Date();
      since.setDate(since.getDate() - DEAL_RISK_LOOKBACK_DAYS);

      const { data: interactions } = contactIds.length > 0
        ? await supabase
            .from('interactions')
            .select('contact_id, sentiment, created_at, initiated_by')
            .in('contact_id', contactIds)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: false })
        : { data: [] as Array<{ contact_id: string; sentiment: string | null; created_at: string; initiated_by: string | null }> };

      type Row = { contact_id: string; sentiment: string | null; created_at: string; initiated_by: string | null };
      const byContact = new Map<string, Row[]>();
      (interactions ?? []).forEach((row) => {
        const list = byContact.get(row.contact_id) ?? [];
        list.push(row as Row);
        byContact.set(row.contact_id, list);
      });

      const isInbound = (by: string | null) => {
        const v = (by ?? '').toLowerCase();
        return v === 'contact' || v === 'cliente' || v === 'inbound';
      };

      const results: DealAtRisk[] = open.map((deal) => {
        const stage = deal.pipeline_stage || 'lead';
        const benchmark = STAGE_BENCHMARK_DAYS[stage] ?? 14;
        const daysInStage = deal.dias_no_estagio_atual ?? 0;
        const stagnation = clamp(((daysInStage / benchmark - 1) / 2) * 100);

        const list = (deal.contact_id && byContact.get(deal.contact_id)) || [];
        const recent = list.slice(0, 5);
        const avgSent = recent.length
          ? recent.reduce((a, b) => a + sentimentValue(b.sentiment), 0) / recent.length
          : 0;
        const sentimentScore = clamp(((-avgSent + 1) / 2) * 100);

        const inbound = list.find((r) => isInbound(r.initiated_by));
        const daysSince = inbound
          ? Math.floor((Date.now() - new Date(inbound.created_at).getTime()) / 86400000)
          : DEAL_RISK_LOOKBACK_DAYS;
        const engagement = clamp((daysSince / DEAL_ENGAGEMENT_GAP_DAYS) * 100);

        const totalAge = deal.created_at
          ? Math.floor((Date.now() - new Date(deal.created_at).getTime()) / 86400000)
          : 0;
        const age = clamp((totalAge / DEAL_RISK_LOOKBACK_DAYS - 0.5) * 100);

        const score = Math.round(
          stagnation * 0.4 + sentimentScore * 0.25 + engagement * 0.25 + age * 0.1
        );
        const level: DealAtRisk['level'] =
          score >= DEAL_RISK_HIGH_THRESHOLD ? 'high' : score >= DEAL_RISK_ATTENTION_THRESHOLD ? 'attention' : 'healthy';

        const factorMap: Array<[number, string]> = [
          [stagnation, 'Estagnação'],
          [sentimentScore, 'Sentimento'],
          [engagement, 'Engajamento'],
          [age, 'Idade'],
        ];
        const topFactor = factorMap.sort((a, b) => b[0] - a[0])[0][1];

        return { deal, score, level, topFactor };
      });

      return results
        .filter((r) => r.level !== 'healthy')
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
  });
}
