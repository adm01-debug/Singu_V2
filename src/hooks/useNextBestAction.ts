import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { useRef } from 'react';

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
  status?: string | null;
  completed_at?: string | null;
   completion_notes?: string | null;
   edited_script?: string | null;
   contextual_tone?: string | null;
   was_successful?: boolean | null;
}

const nextActionFields = {
  contact_id: z.string().min(1),
  action: z.string().min(1),
  reason: z.string().min(1),
  channel: z.enum(['whatsapp', 'email', 'call', 'linkedin', 'meeting']),
  urgency: z.enum(['low', 'medium', 'high']),
  suggested_script: z.string().nullable(),
  expected_outcome: z.string().nullish(),
  generated_at: z.string().datetime({ offset: true }),
  model: z.string().nullable(),
};
const generatedActionSchema = z.object({ success: z.literal(true), next_action: z.object({
  ...nextActionFields, id: z.string().min(1).optional(),
}) });
const persistedActionSchema = z.object({
  ...nextActionFields,
  id: z.string().min(1),
  expected_outcome: z.string().nullable(),
  status: z.string().nullish(),
  completed_at: z.string().nullish(),
  completion_notes: z.string().nullish(),
  edited_script: z.string().nullish(),
  contextual_tone: z.string().nullish(),
  was_successful: z.boolean().nullish(),
});

const STALE_24H = 24 * 60 * 60 * 1000;

export function useNextBestAction(contactId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const recordedCompletions = useRef(new Set<string>());
  const completionsInFlight = useRef(new Map<string, Promise<void>>());

   const query = useQuery({
     queryKey: ['next-best-action', user?.id, contactId],
     enabled: !!user?.id && !!contactId,
     staleTime: STALE_24H,
     queryFn: async (): Promise<NextBestAction | null> => {
       if (!user?.id || !contactId) return null;
       const { data, error } = await supabase
         .from('contact_next_actions')
         .select('id, contact_id, action, reason, channel, urgency, suggested_script, expected_outcome, generated_at, model, status, completed_at, completion_notes, edited_script, contextual_tone, was_successful')
         .eq('user_id', user.id)
         .eq('contact_id', contactId)
         .order('generated_at', { ascending: false })
         .limit(1)
         .maybeSingle();
       if (error) {
         logger.error('useNextBestAction fetch error', error);
         throw error;
       }
       return data ? persistedActionSchema.parse(data) as NextBestAction : null;
     },
   });

  const generate = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      if (!contactId) throw new Error('Contato ausente');
      const { data, error } = await supabase.functions.invoke('next-best-action', {
        body: { contactId },
      });
      if (error) throw error;
      const generated = generatedActionSchema.parse(data).next_action;
      if (generated.contact_id !== contactId) throw new Error('A sugestão retornada pertence a outro contato');
      let confirmation = supabase
        .from('contact_next_actions')
        .select('id, contact_id, action, reason, channel, urgency, suggested_script, expected_outcome, generated_at, model, status, completed_at, completion_notes, edited_script, contextual_tone, was_successful')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .eq('generated_at', generated.generated_at);
      if (generated.id) confirmation = confirmation.eq('id', generated.id);
      const { data: persisted, error: persistenceError } = await confirmation.single();
      if (persistenceError) throw persistenceError;
      if (!persisted) throw new Error('A sugestão foi gerada, mas sua gravação não foi confirmada');
      return persistedActionSchema.parse(persisted) as NextBestAction;
    },
    onSuccess: (data) => {
      qc.setQueryData(['next-best-action', user?.id, contactId], data);
      toast.success('Próxima ação gerada');
    },
    onError: (err) => {
      logger.error('generate NBA error', err);
      const msg = err instanceof Error ? err.message : 'Erro ao gerar sugestão';
      toast.error(msg);
    },
  });

   const updateScript = useMutation({
     mutationFn: async ({ id, script }: { id: string; script: string }) => {
       if (!user) throw new Error('Não autenticado');
       const { error } = await supabase
         .from('contact_next_actions')
         .update({ edited_script: script })
         .eq('id', id)
         .eq('user_id', user.id);
       if (error) throw error;
     },
     onSuccess: () => {
       qc.invalidateQueries({ queryKey: ['next-best-action', user?.id, contactId] });
       toast.success('Script atualizado');
     },
     onError: () => toast.error('Erro ao atualizar script'),
   });

   const complete = useMutation({
     mutationFn: async ({ id, notes, completed_at, was_successful }: { id: string; notes?: string; completed_at?: string; was_successful?: boolean }) => {
      if (!user) throw new Error('Não autenticado');
      const currentAction = query.data;
      if (!contactId || !currentAction || currentAction.id !== id || currentAction.contact_id !== contactId) {
        throw new Error('A ação a concluir não corresponde ao contato carregado');
      }
      if (currentAction.status === 'completed') throw new Error('Esta ação já foi concluída');
      const completionKey = JSON.stringify([user.id, contactId, id, currentAction.generated_at]);
      const pending = completionsInFlight.current.get(completionKey);
      if (pending) return pending;
      const completion = (async () => {
        // Uma falha no status não deve duplicar a interação na mesma instância do hook.
        // Idempotência entre abas/recarregamentos e atomicidade ainda exigem backend transacional.
        if (!recordedCompletions.current.has(completionKey)) {
          const { error: intError } = await supabase.from('interactions').insert([{
            contact_id: contactId,
            user_id: user.id,
            type: currentAction.channel === 'linkedin' ? 'social' : currentAction.channel,
            channel: currentAction.channel,
            direction: 'outbound',
            initiated_by: 'us',
            title: 'Ação Concluída',
            content: `Próxima ação concluída: ${currentAction.action}. ${notes || ''}`,
          }]);
          if (intError) throw intError;
          recordedCompletions.current.add(completionKey);
        }
        const { data: completedAction, error } = await supabase.from('contact_next_actions').update({
          status: 'completed',
          completed_at: completed_at || new Date().toISOString(),
          completion_notes: notes,
          was_successful: was_successful ?? true,
        }).eq('id', id).eq('user_id', user.id).eq('contact_id', contactId).eq('generated_at', currentAction.generated_at).select('id').single();
        if (error) throw error;
        if (!completedAction || completedAction.id !== id) throw new Error('A conclusão da ação não foi confirmada');
      })();
      completionsInFlight.current.set(completionKey, completion);
      try {
        await completion;
      } finally {
        completionsInFlight.current.delete(completionKey);
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
    error: query.error,
    isGenerating: generate.isPending,
    isCompleting: complete.isPending,
    generate: generate.mutate,
     complete: complete.mutate,
     updateScript: updateScript.mutate,
    refetch: query.refetch,
  };
}
