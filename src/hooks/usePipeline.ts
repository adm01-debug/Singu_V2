import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { supabase } from '@/integrations/supabase/client';
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
  company_id: string;
  contact_id?: string;
  company_name?: string;
  contact_name?: string;
  previsao_fechamento?: string;
  dias_no_estagio_atual?: number;
  created_at: string;
}

export interface PipelineSummary {
  total_deals: number;
  total_value: number;
  weighted_value: number;
  stages: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  avg_cycle_days: number;
  conversion_rate: number;
}

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
      const { data, error } = await callExternalRpc<PipelineDeal[]>(
        'get_deals_pipeline',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data || [];
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
       const { data, error } = await supabase.rpc('move_deal_atomic', {
         p_deal_id: dealId,
         p_new_stage: newStageId,
         p_new_probability: probability
      });
      if (error) { throw error; }
       const result = data as { success?: boolean; error?: string } | null;
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
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] });
      queryClient.invalidateQueries({ queryKey: ['weighted-forecast'] });
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
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] });
    },
    onError: () => toast.error('Erro ao criar negócio'),
  });
}
