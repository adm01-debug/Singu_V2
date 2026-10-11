import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export interface InteractionHistoryItem {
  id: string;
  company_id?: string;
  contact_id?: string;
  type: string;
  channel: string;
  direction?: string;
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
      const { data, error } = await callExternalRpc<unknown>(
        'get_interaction_history',
        params
      );
      if (error) throw error;
      return z.array(z.object({
        id: z.string(), tipo_interacao: z.string(), canal: z.string(),
        resumo: z.string().nullable(), created_at: z.string(),
        usuario_responsavel_id: z.number().nullable(), vendedor_nome: z.string().nullable(),
      })).parse(data ?? []).map((it): InteractionHistoryItem => ({
        id: it.id, company_id: companyId, type: it.tipo_interacao,
        channel: it.canal, resumo: it.resumo ?? undefined, data_interacao: it.created_at,
      }));
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unified-communication-history', entityId, entityType, limit, user?.id],
    queryFn: async () => {
      // A RPC canônica aceita somente p_company_id; contatos usam os mesmos campos reais.
      if (entityType === 'contact') {
        if (!user?.id) throw new Error('Não autenticado');
        const { data, error } = await supabase.from('interactions')
          .select('id, company_id, contact_id, type, channel, resumo, content, data_interacao')
          .eq('contact_id', entityId).eq('user_id', user.id)
          .order('data_interacao', { ascending: false }).limit(limit);
        if (error) throw error;
        return (data ?? []).map((row): InteractionHistoryItem => ({
          id: row.id, company_id: row.company_id ?? undefined, contact_id: row.contact_id ?? undefined,
          type: z.string().parse(row.type), channel: z.string().parse(row.channel),
          resumo: row.resumo ?? row.content ?? undefined,
          data_interacao: z.string().parse(row.data_interacao),
        }));
      }
      const { data, error } = await callExternalRpc<unknown>(
        'get_unified_communication_history',
        { p_company_id: entityId, p_limit: limit }
      );
      if (error) throw error;
      return z.array(z.object({
        interaction_id: z.string(), interaction_type: z.string(), channel: z.string(),
        summary: z.string().nullable(), interaction_date: z.string(), user_name: z.string(),
      })).parse(data ?? []).map((it): InteractionHistoryItem => ({
        id: it.interaction_id, company_id: entityType === 'company' ? entityId : undefined,
        type: it.interaction_type, channel: it.channel, resumo: it.summary ?? undefined,
        data_interacao: it.interaction_date,
      }));
    },
    enabled: !!entityId && (entityType !== 'contact' || !!user),
    staleTime: 3 * 60 * 1000,
  });
}
