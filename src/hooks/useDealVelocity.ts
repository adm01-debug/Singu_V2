import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StageVelocity {
  stage: string;
  stageName: string;
  /** Média de dias parados no estágio: hoje menos o último `updated_at` do contato. */
  averageDays: number;
  /** Mediana dos estágios com contatos — a própria base do usuário, não um número fixo. */
  benchmark: number;
  contactCount: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface MonthlyTrend {
  month: string;
  velocity: number;
}

interface DealVelocityMetrics {
  averageCycleTime: number;
  projectedConversions: number;
  totalActiveDeals: number;
  bottleneckStage: string | null;
  fastestStage: string | null;
  stageVelocities: StageVelocity[];
  monthlyTrend: MonthlyTrend[];
}

const STAGE_CONFIG: Record<string, string> = {
  new: 'Novo',
  prospect: 'Prospect',
  qualified_lead: 'Lead Qualificado',
  qualified: 'Qualificado',
  opportunity: 'Oportunidade',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  customer: 'Cliente',
  advocate: 'Promotor',
  closed: 'Fechado',
  churned: 'Perdido',
  unknown: 'Sem estágio',
};

/** Estágios que representam relacionamento já convertido. */
const CONVERTED_STAGES = new Set(['customer', 'advocate', 'closed']);
/** Estágios que saíram do funil e não contam como ativos. */
const INACTIVE_STAGES = new Set(['churned', 'unknown']);

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function stageLabel(stage: string): string {
  if (STAGE_CONFIG[stage]) return STAGE_CONFIG[stage];
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Estagnação do pipeline a partir dos estágios de relacionamento dos contatos.
 *
 * Não existe tabela de histórico de transição de estágio no banco, então não há
 * como medir "tempo até avançar de estágio". O que é medido aqui, e é real, é há
 * quantos dias cada contato está parado no estágio em que está (`updated_at`).
 */
export function useDealVelocity() {
  const { user } = useAuth();

  const { data: metrics = null, isLoading: loading, error } = useQuery({
    queryKey: ['deal-velocity', user?.id],
    queryFn: async (): Promise<DealVelocityMetrics | null> => {
      if (!user) return null;

      const { data: contacts, error: queryError } = await supabase
        .from('contacts')
        .select('id, relationship_stage, relationship_score, created_at, updated_at')
        .eq('user_id', user.id);

      if (queryError) throw queryError;
      if (!contacts || contacts.length === 0) return null;

      const now = Date.now();
      const perStage = new Map<string, { count: number; totalDays: number }>();

      for (const contact of contacts) {
        const stage = contact.relationship_stage || 'unknown';
        const reference = contact.updated_at ?? contact.created_at;
        const days = reference
          ? Math.max(0, Math.round((now - new Date(reference).getTime()) / MS_PER_DAY))
          : 0;
        const bucket = perStage.get(stage) ?? { count: 0, totalDays: 0 };
        bucket.count += 1;
        bucket.totalDays += days;
        perStage.set(stage, bucket);
      }

      const stageVelocities: StageVelocity[] = [...perStage.entries()]
        .map(([stage, bucket]) => ({
          stage,
          stageName: stageLabel(stage),
          averageDays: Math.round(bucket.totalDays / bucket.count),
          benchmark: 0,
          contactCount: bucket.count,
          trend: 'stable' as const,
        }))
        .sort((a, b) => b.contactCount - a.contactCount);

      const benchmark = median(stageVelocities.map((s) => s.averageDays));
      for (const stage of stageVelocities) stage.benchmark = benchmark;

      const funnelStages = stageVelocities.filter((s) => !INACTIVE_STAGES.has(s.stage));
      const slowest = [...funnelStages].sort((a, b) => b.averageDays - a.averageDays)[0];
      const fastest = [...funnelStages].sort((a, b) => a.averageDays - b.averageDays)[0];

      const totalActive = funnelStages.reduce((sum, s) => sum + s.contactCount, 0);
      const converted = stageVelocities
        .filter((s) => CONVERTED_STAGES.has(s.stage))
        .reduce((sum, s) => sum + s.contactCount, 0);
      const classified = stageVelocities
        .filter((s) => s.stage !== 'unknown')
        .reduce((sum, s) => sum + s.contactCount, 0);
      const conversionRate = classified > 0 ? converted / classified : 0;

      const openStages = funnelStages.filter((s) => !CONVERTED_STAGES.has(s.stage));
      const openContacts = openStages.reduce((sum, s) => sum + s.contactCount, 0);
      const averageCycleTime = openContacts > 0
        ? Math.round(
            openStages.reduce((sum, s) => sum + s.averageDays * s.contactCount, 0) / openContacts,
          )
        : 0;

      return {
        averageCycleTime,
        projectedConversions: Math.round(openContacts * conversionRate),
        totalActiveDeals: totalActive,
        bottleneckStage: slowest?.stage ?? null,
        fastestStage: fastest?.stage ?? null,
        stageVelocities,
        // Sem histórico de transição de estágio no banco não há série temporal honesta.
        monthlyTrend: [],
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { metrics, loading, error };
}
