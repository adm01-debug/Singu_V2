import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  channel: 'email' | 'whatsapp' | 'call' | 'linkedin' | 'sms';
  delay_days: number;
  delay_hours: number;
  subject: string | null;
  message_template: string | null;
  notes: string | null;
  condition_type?: string;
  condition_wait_hours?: number;
  branch_on_yes_step?: number | null;
  branch_on_no_step?: number | null;
}

export interface Sequence {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'active' | 'paused' | 'archived';
  pause_on_reply: boolean;
  pause_on_meeting: boolean;
  max_enrollments: number;
  total_enrolled: number;
  total_completed: number;
  total_replied: number;
  created_at: string;
  updated_at: string;
  steps?: SequenceStep[];
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  user_id: string;
  status: 'active' | 'paused' | 'completed' | 'replied' | 'bounced' | 'unsubscribed';
  current_step: number;
  next_action_at: string | null;
  enrolled_at: string;
  completed_at: string | null;
  replied_at: string | null;
}

export interface CreateSequenceData {
  name: string;
  description?: string;
  pause_on_reply?: boolean;
  pause_on_meeting?: boolean;
  steps: Omit<SequenceStep, 'id' | 'sequence_id'>[];
}

export function useSequences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['sequences', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as unknown as Sequence[];
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const createSequence = useMutation({
    mutationFn: async (input: CreateSequenceData) => {
      if (!userId) throw new Error('Não autenticado');
      const { steps, ...seqData } = input;

      const { data: seq, error } = await supabase
        .from('sequences')
        .insert({ ...seqData, user_id: userId })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!seq) throw new Error('Falha ao criar sequência');

      if (steps.length > 0) {
        const stepsToInsert = steps.map((s, i) => ({
          sequence_id: seq.id,
          step_order: i + 1,
          channel: s.channel,
          delay_days: s.delay_days,
          delay_hours: s.delay_hours,
          subject: s.subject || null,
          message_template: s.message_template || null,
          notes: s.notes || null,
          condition_type: s.condition_type ?? 'always',
          condition_wait_hours: s.condition_wait_hours ?? 24,
          branch_on_yes_step: s.branch_on_yes_step ?? null,
          branch_on_no_step: s.branch_on_no_step ?? null,
        }));
        const { error: stepsError } = await supabase
          .from('sequence_steps')
          .insert(stepsToInsert);
        if (stepsError) throw stepsError;
      }
      return seq;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Sequência criada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('sequences')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status da sequência'),
  });

  const deleteSequence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sequences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Sequência removida');
    },
    onError: () => toast.error('Erro ao remover sequência'),
  });

  const fetchSteps = async (sequenceId: string): Promise<SequenceStep[]> => {
    const { data, error } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('step_order')
      .limit(1000);
    if (error) throw error;
    return (data || []) as unknown as SequenceStep[];
  };

  const enrollContact = useMutation({
    mutationFn: async ({ sequenceId, contactId }: { sequenceId: string; contactId: string }) => {
      if (!userId) throw new Error('Não autenticado');
      const [{ error }, { error: updError }] = await Promise.all([
        supabase.from('sequence_enrollments').insert({
          sequence_id: sequenceId,
          contact_id: contactId,
          user_id: userId,
          next_action_at: new Date().toISOString(),
        }),
        supabase.from('sequences')
          .update({ total_enrolled: (sequences.find(s => s.id === sequenceId)?.total_enrolled || 0) + 1 })
          .eq('id', sequenceId),
      ]);
      if (error) throw error;
      if (updError) logger.error('Failed to update enrollment count', updError);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sequences'] });
      toast.success('Contato inscrito na sequência');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    sequences,
    loading: isLoading,
    createSequence: createSequence.mutateAsync,
    toggleStatus: toggleStatus.mutateAsync,
    deleteSequence: deleteSequence.mutateAsync,
    fetchSteps,
    enrollContact: enrollContact.mutateAsync,
    creating: createSequence.isPending,
  };
}
