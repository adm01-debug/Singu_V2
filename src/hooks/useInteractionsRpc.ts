import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface InteractionHistoryItem {
  id: string;
  company_id?: string;
  contact_id?: string;
  type: string;
  channel: string;
  direction?: string;
  resumo?: string;
  data_interacao: string | null;
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

/**
 * Retorno real de `get_optimal_contact_windows()`:
 * TABLE(window_name text, success_rate numeric, total_interactions bigint).
 * O tipo antigo declarava `day_of_week`, `hour` e `total_attempts`, que a
 * função nunca devolveu — o widget renderizava campos vazios.
 */
export interface OptimalContactWindow {
  window_name: string;
  success_rate: number | null;
  total_interactions: number | null;
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
        id: z.string(), tipo_interacao: z.string().nullable(), canal: z.string().nullable(),
        resumo: z.string().nullable(), created_at: z.string().nullable(),
        usuario_responsavel_id: z.number().nullable(), vendedor_nome: z.string().nullable(),
      })).parse(data ?? []).map((it): InteractionHistoryItem => ({
        id: it.id, company_id: companyId, type: it.tipo_interacao ?? 'other',
        channel: it.canal ?? '', resumo: it.resumo ?? undefined, data_interacao: it.created_at,
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
    mutationFn: async (params: Database['public']['Functions']['create_quick_interaction']['Args']) => {
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

export function useCreateContactQuickInteraction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    // `create_quick_interaction` em producao e por EMPRESA
    // (p_company_id, p_tipo, p_resumo, p_vendedor_id, p_followup_dias) e nao
    // aceita `p_contact_interaction` — a chamada antiga nunca encontrava a
    // funcao. Nao existe RPC equivalente por contato, entao a interacao e
    // gravada direto em `interactions`, do mesmo jeito que useNextBestAction
    // ja faz ao concluir uma acao.
    mutationFn: async (params: { p_contact_id: string; p_tipo: string; p_resumo: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('interactions')
        .insert([{
          contact_id: params.p_contact_id,
          user_id: user.id,
          type: params.p_tipo,
          channel: params.p_tipo,
          direction: 'outbound',
          initiated_by: 'us',
          title: 'Interação rápida',
          content: params.p_resumo,
        }])
        .select('id, contact_id')
        .single();
      if (error) throw error;
      return z.object({
        id: z.string().uuid(),
        contact_id: z.literal(params.p_contact_id),
      }).parse(data);
    },
    onSuccess: (_data, params) => {
      for (const queryKey of [
        ['external-interactions', params.p_contact_id],
        ['contact-intelligence', params.p_contact_id],
        ['contact-view-360', user?.id, params.p_contact_id],
        ['contact', user?.id, params.p_contact_id],
        ['interactions', params.p_contact_id],
        ['complete-dashboard'],
      ]) {
        queryClient.invalidateQueries({ queryKey });
      }
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

/**
 * `get_optimal_contact_windows()` nao recebe argumento: o padrao de horario e
 * calculado sobre toda a base, nao por empresa. Passar `p_company_id` fazia o
 * PostgREST nao encontrar a funcao. O `companyId` segue apenas governando
 * quando o widget da ficha da empresa busca.
 */
export function useOptimalContactWindows(companyId?: string) {
  return useQuery({
    queryKey: ['optimal-contact-windows'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<OptimalContactWindow[]>(
        'get_optimal_contact_windows',
        {}
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
          .eq('contact_id', entityId ?? '').eq('user_id', user.id)
          .order('data_interacao', { ascending: false }).limit(limit);
        if (error) throw error;
        return (data ?? []).map((row): InteractionHistoryItem => ({
          id: row.id, company_id: row.company_id ?? undefined, contact_id: row.contact_id ?? undefined,
          type: z.string().nullable().parse(row.type) ?? row.channel ?? 'note',
          channel: z.string().nullable().parse(row.channel) ?? row.type ?? 'note',
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
        interaction_id: z.string(), interaction_type: z.string().nullable(), channel: z.string().nullable(),
        summary: z.string().nullable(), interaction_date: z.string(), user_name: z.string(),
      })).parse(data ?? []).map((it): InteractionHistoryItem => ({
        id: it.interaction_id, company_id: entityType === 'company' ? entityId : undefined,
        type: it.interaction_type ?? it.channel ?? 'note', channel: it.channel ?? it.interaction_type ?? 'note', resumo: it.summary ?? undefined,
        data_interacao: it.interaction_date,
      }));
    },
    enabled: !!entityId && (entityType !== 'contact' || !!user),
    staleTime: 3 * 60 * 1000,
  });
}
