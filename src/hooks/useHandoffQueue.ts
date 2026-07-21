import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { HandoffRequest, HandoffStatus, QualificationData } from '@/types/leadRouting';
import type { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const HANDOFF_KEY = ['handoff-requests'];

export function useHandoffQueue(status?: HandoffStatus) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...HANDOFF_KEY, status, user?.id],
    queryFn: async (): Promise<HandoffRequest[]> => {
      if (!user) return [];
      let query = supabase
        .from('handoff_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as HandoffRequest[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useCreateHandoff() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      contactId?: string;
      companyId?: string;
      fromMemberId: string;
      toMemberId?: string;
      qualificationData: QualificationData;
      reason?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('handoff_requests')
        .insert({
          user_id: user.id,
          contact_id: payload.contactId ?? null,
          company_id: payload.companyId ?? null,
          from_member_id: payload.fromMemberId,
          to_member_id: payload.toMemberId ?? null,
          status: 'pending',
          qualification_data: payload.qualificationData as unknown as Json,
          handoff_reason: payload.reason ?? null,
          notes: payload.notes ?? null,
          sla_hours: 4,
        } as TablesInsert<'handoff_requests'>)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar solicitação de handoff');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANDOFF_KEY });
      toast.success('Handoff solicitado com sucesso');
    },
    onError: () => toast.error('Erro ao solicitar handoff'),
  });
}

export function useRespondHandoff() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
      rejectionReason,
    }: {
      id: string;
      action: 'accept' | 'reject';
      rejectionReason?: string;
    }) => {
      const now = new Date().toISOString();
      const updates: Record<string, unknown> =
        action === 'accept'
          ? { status: 'accepted', accepted_at: now }
          : { status: 'rejected', rejected_at: now, rejection_reason: rejectionReason ?? null };

      const { error } = await supabase
        .from('handoff_requests')
        .update(updates as unknown as TablesUpdate<'handoff_requests'>)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: HANDOFF_KEY });
      qc.invalidateQueries({ queryKey: ['lead-assignments'] });
      toast.success(vars.action === 'accept' ? 'Handoff aceito' : 'Handoff rejeitado');
    },
    onError: () => toast.error('Erro ao responder handoff'),
  });
}

export function usePendingHandoffCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['handoff-pending-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('handoff_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) {
        logger.error('Erro contando handoffs:', error);
        return 0;
      }
      return count ?? 0;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/** Realtime subscription for handoff changes — auto-invalidates queries */
export function useHandoffRealtime() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('handoff-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'handoff_requests', filter: `user_id=eq.${user.id}` },
        (payload) => {
          logger.info('[Handoff Realtime]', payload.eventType);
          qc.invalidateQueries({ queryKey: HANDOFF_KEY });
          qc.invalidateQueries({ queryKey: ['handoff-pending-count'] }); // prefix-match invalidates all users

          if (payload.eventType === 'INSERT') {
            toast.info('Novo handoff recebido', {
              description: 'Um SDR solicitou transferência de lead.',
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);
}
