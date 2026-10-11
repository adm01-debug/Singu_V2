import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc, queryExternalData } from '@/lib/externalData';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────

export interface PipelineDeal {
  id: string;
  titulo: string;
  valor: number;
  status: string;
  pipeline_stage: string;
  probabilidade: number;
  company_id: string | null;
  contact_id?: string | null;
  company_name?: string;
  contact_name?: string;
  previsao_fechamento?: string;
  dias_no_estagio_atual?: number;
  created_at: string | null;
  closed_at?: string | null;
}

export interface PipelineSummary {
  by_status: Record<string, {
    count: number;
    recent: number;
  }>;
  by_segment: Record<string, number>;
  by_state: Record<string, number>;
  totals: {
    active: number;
    inactive: number;
    with_recent_interaction: number;
  };
}

type PipelineDealRow = Omit<PipelineDeal, 'valor' | 'probabilidade' | 'pipeline_stage'> & {
  valor: number | null;
  probabilidade: number | null;
  pipeline_stage: string | null;
  company: { nome_crm: string } | null;
  contact: { first_name: string; last_name: string | null } | null;
};

export interface WeightedForecast {
  stage: string;
  count: number;
  total_value: number;
  probability: number;
  weighted_value: number;
}

export interface StageVelocity {
  stage: string;
  avg_days: number;
  median_days: number;
  deal_count: number;
}

export interface StalledDeal {
  id: string;
  titulo: string;
  valor: number;
  stage: string;
  days_stalled: number;
  company_name: string;
  contact_name?: string;
}

export interface VelocityMetrics {
  avg_cycle_days: number;
  median_cycle_days: number;
  win_rate: number;
  avg_deal_size: number;
  velocity_score: number;
}

// ── Hooks ──────────────────────────────────────────

export function useDealsPipeline() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['deals-pipeline', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const deals: PipelineDeal[] = [];
      const pageSize = 500;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await queryExternalData<PipelineDealRow>({
          table: 'deals',
          select: '*, company:companies(nome_crm), contact:contacts(first_name, last_name)',
          filters: [
            { type: 'eq', column: 'user_id', value: user.id },
            { type: 'neq', column: 'status', value: 'perdido' },
            { type: 'neq', column: 'status', value: 'arquivado' },
            { type: 'neq', column: 'status', value: 'lost' },
          ],
          order: [{ column: 'created_at', ascending: false }, { column: 'id', ascending: false }],
          range: { from: offset, to: offset + pageSize - 1 },
        });
        if (error) throw error;
        deals.push(...(data || []).map(({ company, contact, ...row }) => ({
          ...row,
          valor: row.valor ?? 0,
          probabilidade: row.probabilidade ?? 0,
          pipeline_stage: row.pipeline_stage ?? 'lead',
          company_name: company?.nome_crm,
          contact_name: contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') : undefined,
        })));
        if (!data || data.length < pageSize) break;
      }
      return deals;
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function usePipelineSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pipeline-summary', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<PipelineSummary>(
        'get_pipeline_summary',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeightedForecast() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['weighted-forecast', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<WeightedForecast[]>(
        'get_weighted_forecast',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useStageVelocity() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stage-velocity', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<StageVelocity[]>(
        'get_stage_velocity',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useStalledDeals(days = 14) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['stalled-deals', days, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<StalledDeal[]>(
        'get_stalled_deals',
        { p_user_id: user.id, p_days: days }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useVelocityMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['velocity-metrics', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<VelocityMetrics>(
        'get_velocity_metrics',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, newStageId, probability }: {
      dealId: string;
      newStageId: string;
      probability?: number;
    }) => {
       const { data, error } = await callExternalRpc<{ success?: boolean; error?: string }>('move_deal_atomic', {
         p_deal_id: dealId,
         p_new_stage: newStageId,
         p_new_probability: probability
      });
      if (error) { throw error; }
       const result = data;
       if (result && result.success === false) {
         throw new Error(result.error || 'Failed to move deal');
       }
       return data;
    },
    // Optimistic update: aplica imediatamente no cache antes do servidor confirmar
    onMutate: async ({ dealId, newStageId, probability }) => {
      await queryClient.cancelQueries({ queryKey: ['deals-pipeline'] });
      const previous = queryClient.getQueriesData<PipelineDeal[]>({ queryKey: ['deals-pipeline'] });
      queryClient.setQueriesData<PipelineDeal[]>({ queryKey: ['deals-pipeline'] }, (old) => {
        if (!old) return old;
        return old.map((d) =>
          d.id === dealId
            ? { ...d, pipeline_stage: newStageId, ...(probability !== undefined ? { probabilidade: probability } : {}) }
            : d
        );
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback em caso de erro
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      for (const key of ['deals-pipeline', 'pipeline-summary', 'weighted-forecast', 'velocity-metrics',
        'stage-velocity', 'stalled-deals', 'company-deals', 'daily-summary', 'channel-analysis', 'seasonality']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: Record<string, unknown>) => {
      const { data, error } = await callExternalRpc<{ id: string }>(
        'create_deal',
        params
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      for (const key of ['deals-pipeline', 'pipeline-summary', 'weighted-forecast', 'velocity-metrics',
        'stage-velocity', 'stalled-deals', 'company-deals', 'daily-summary', 'channel-analysis', 'seasonality']) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: () => toast.error('Erro ao criar negócio'),
  });
}
