import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { logger } from '@/lib/logger';

/**
 * Fila de aprovação de follow-ups gerados pela IA.
 *
 * `StrategicNextStepsCard` grava o pedido em `follow_up_approvals_v2` e
 * prometia "aguardando sua revisão na fila de aprovação" — mas nenhuma tela
 * lia essa tabela. As RPCs `approve_follow_up`/`reject_follow_up` existem, mas
 * atuam em `follow_up_approvals` (v1), que o front nunca escreveu: são
 * entidades distintas, sem trigger de sincronização. Decidir aqui é UPDATE na
 * v2, a mesma tabela que o card alimenta.
 */
export interface FollowUpApproval {
  id: string;
  contact_id: string | null;
  content: string;
  channel: string | null;
  status: string | null;
  scheduled_at: string | null;
  created_at: string | null;
  contact_name?: string | null;
}

export type FollowUpDecision = 'approved' | 'rejected';

export function useFollowUpApprovals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['follow-up-approvals', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<FollowUpApproval[]> => {
      const { data, error } = await supabase
        .from('follow_up_approvals_v2')
        .select('id, contact_id, content, channel, status, scheduled_at, created_at')
        .eq('user_id', user!.id)
        .in('status', ['pending'])
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as FollowUpApproval[];
      const contactIds = [...new Set(rows.map(r => r.contact_id).filter((v): v is string => !!v))];
      if (contactIds.length === 0) return rows;

      // `contact_id` é text na v2; `contacts.id` é uuid, então o filtro `in`
      // só recebe os valores que são UUID válidos.
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validIds = contactIds.filter(id => uuidRe.test(id));
      if (validIds.length === 0) return rows;

      const { data: contatos, error: contatosError } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .in('id', validIds);
      if (contatosError) {
        logger.warn('[FollowUpApprovals] nomes de contato indisponíveis:', contatosError.message);
        return rows;
      }

      const nomes = new Map<string, string>(
        (contatos ?? []).map(c => [
          c.id,
          `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        ]),
      );
      return rows.map(r => ({
        ...r,
        contact_name: r.contact_id ? nomes.get(r.contact_id) ?? null : null,
      }));
    },
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useDecideFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: FollowUpDecision }) => {
      const { error } = await supabase
        .from('follow_up_approvals_v2')
        .update({ status: decision, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'pending');
      if (error) throw error;
      return decision;
    },
    onSuccess: decision => {
      qc.invalidateQueries({ queryKey: ['follow-up-approvals'] });
      qc.invalidateQueries({ queryKey: ['ai-recommendation-audit-logs'] });
      toast.success(decision === 'approved' ? 'Follow-up aprovado' : 'Follow-up rejeitado');
    },
    onError: err => {
      logger.error('[FollowUpApprovals] decisão falhou:', err);
      toast.error('Erro ao registrar a decisão');
    },
  });
}