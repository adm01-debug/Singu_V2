import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface InteractionHistoryItem {
  id: string;
  company_id: string;
  contact_id?: string;
  type: string;
  channel: string;
  direction: string;
  resumo?: string;
  data_interacao: string;
  follow_up_date?: string;
  company_name?: string;
  contact_name?: string;
}

export interface PendingFollowup {
  id: string;
  company_id: string;
  contact_id?: string;
  type: string;
  resumo?: string;
  follow_up_date: string;
  company_name?: string;
  contact_name?: string;
  days_overdue: number;
}

export interface ActivityHeatmapData {
  day_of_week: number;
  hour: number;
  count: number;
}

export interface OptimalContactWindow {
  day_of_week: number;
  hour: number;
  success_rate: number;
  total_attempts: number;
}

export function useInteractionHistory(companyId?: string, tipo?: string, limit = 50) {
  return useQuery({
    queryKey: ['interaction-history', companyId, tipo, limit],
    queryFn: async () => {
      const params: Record<string, unknown> = { p_company_id: companyId, p_limit: limit };
      if (tipo) params.p_tipo = tipo;
      const { data, error } = await callExternalRpc<InteractionHistoryItem[]>(
        'get_interaction_history',
        params
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 3 * 60 * 1000,
  });
}

export function usePendingFollowups(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pending-followups', limit, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<PendingFollowup[]>(
        'get_pending_followups',
        { p_user_id: user.id, p_limit: limit }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 3 * 60 * 1000,
  });
}

export function useCompleteFollowup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (interactionId: string) => {
      const { data, error } = await callExternalRpc(
        'complete_followup',
        { p_interaction_id: interactionId }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-followups'] });
      queryClient.invalidateQueries({ queryKey: ['interaction-history'] });
    },
    onError: () => toast.error('Erro ao concluir follow-up'),
  });
}

export function useCreateQuickInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      p_company_id?: string;
      p_contact_id?: string;
      p_tipo: string;
      p_resumo: string;
      p_followup_dias?: number;
    }) => {
      const { data, error } = await callExternalRpc(
        'create_quick_interaction',
        params
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interaction-history'] });
      queryClient.invalidateQueries({ queryKey: ['pending-followups'] });
      queryClient.invalidateQueries({ queryKey: ['complete-dashboard'] });
    },
    onError: () => toast.error('Erro ao registrar interação'),
  });
}

export function useActivityHeatmap(days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['activity-heatmap', days, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ActivityHeatmapData[]>(
        'get_activity_heatmap',
        { p_days: days }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useOptimalContactWindows(companyId?: string) {
  return useQuery({
    queryKey: ['optimal-contact-windows', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<OptimalContactWindow[]>(
        'get_optimal_contact_windows',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useUnifiedCommunicationHistory(entityId?: string, limit = 50, entityType: 'company' | 'contact' = 'company') {
  return useQuery({
    queryKey: ['unified-communication-history', entityId, entityType, limit],
    queryFn: async () => {
      const params: Record<string, unknown> = { p_limit: limit };
      if (entityType === 'contact') {
        params.p_contact_id = entityId;
      } else {
        params.p_company_id = entityId;
      }
      const { data, error } = await callExternalRpc<InteractionHistoryItem[]>(
        'get_unified_communication_history',
        params
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId,
    staleTime: 3 * 60 * 1000,
  });
}
