import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface NextBestAction {
  id: string;
  contact_id: string;
  action: string;
  reason: string;
  channel: string;
  urgency: 'low' | 'medium' | 'high';
  suggested_script: string | null;
  expected_outcome: string | null;
  generated_at: string;
  model: string | null;
  status?: string;
  completed_at?: string;
  completion_notes?: string;
}

const STALE_24H = 24 * 60 * 60 * 1000;

export function useNextBestAction(contactId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['next-best-action', user?.id, contactId],
    enabled: !!user?.id && !!contactId,
    staleTime: STALE_24H,
    queryFn: async (): Promise<NextBestAction | null> => {
      if (!user?.id || !contactId) return null;
      const { data, error } = await supabase
        .from('contact_next_actions')
        .select('id, contact_id, action, reason, channel, urgency, suggested_script, expected_outcome, generated_at, model')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .maybeSingle();
      if (error) {
        logger.error('useNextBestAction fetch error', error);
        return null;
      }
      return (data as NextBestAction | null) ?? null;
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      if (!contactId) throw new Error('contact_id ausente');
      const { data, error } = await supabase.functions.invoke('next-best-action', {
        body: { contact_id: contactId },
      });
      if (error) throw error;
      return data?.next_action as NextBestAction;
    },
    onSuccess: (data) => {
      qc.setQueryData(['next-best-action', user?.id, contactId], data);
      toast.success('🎯 Próxima ação gerada');
    },
    onError: (err) => {
      logger.error('generate NBA error', err);
      const msg = err instanceof Error ? err.message : 'Erro ao gerar sugestão';
      toast.error(msg);
    },
  });

  const complete = useMutation({
    mutationFn: async ({ id, notes, completed_at }: { id: string; notes?: string; completed_at?: string }) => {
      const { error } = await supabase
        .from('contact_next_actions')
        .update({ 
          status: 'completed', 
          completed_at: completed_at || new Date().toISOString(),
          completion_notes: notes 
        })
        .eq('id', id);
      
      if (error) throw error;

      // Also create an interaction entry to reflect this completion in history
      const currentAction = query.data;
      if (currentAction && user?.id && contactId) {
        const { error: intError } = await supabase.from('interactions').insert([{
          contact_id: contactId,
          user_id: user.id,
          type: currentAction.channel,
          title: 'Ação Concluída',
          content: `Próxima ação concluída: ${currentAction.action}. ${notes || ''}`,
        }]);
        if (intError) logger.error('Error creating completion interaction', intError);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['next-best-action', user?.id, contactId] });
      qc.invalidateQueries({ queryKey: ['contact-interactions', contactId] });
      toast.success('Tarefa marcada como concluída');
    },
    onError: (err) => {
      logger.error('complete NBA error', err);
      toast.error('Erro ao concluir tarefa');
    }
  });

  return {
    nextAction: query.data && query.data.status !== 'completed' ? query.data : null,
    isLoading: query.isLoading,
    isGenerating: generate.isPending,
    isCompleting: complete.isPending,
    generate: generate.mutate,
    complete: complete.mutate,
    refetch: query.refetch,
  };
}
