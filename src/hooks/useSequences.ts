import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { callExternalRpc } from '@/lib/externalData';
import { z } from 'zod';

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

const pendingManualStepSchema = z.object({
  pending_manual_step: z.object({
    step_id: z.string().uuid(),
    step_order: z.number().int().positive(),
    channel: z.string(),
  }),
});

export function useSequenceManualSteps(sequenceId?: string, enabled = true) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const pending = useQuery({
    queryKey: ['sequence-manual-steps', sequenceId, user?.id],
    enabled: enabled && !!sequenceId && !!user,
    queryFn: async () => {
      const { data: steps, error: stepError } = await supabase.from('sequence_steps')
        .select('id, step_order, channel, notes, message_template')
        .eq('sequence_id', sequenceId!).eq('user_id', user!.id);
      if (stepError) throw stepError;
      const tasks: Array<{
        enrollmentId: string; contactId: string; contactName: string; email: string | null;
        stepId: string; stepOrder: number; channel: string; instructions: string | null; valid: boolean;
      }> = [];
      const pageSize = 100;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from('sequence_enrollments')
          .select('id, contact_id, metadata')
          .eq('sequence_id', sequenceId!).eq('user_id', user!.id).eq('status', 'paused')
          .not('metadata->pending_manual_step', 'is', null)
          .order('id').range(offset, offset + pageSize - 1);
        if (error) throw error;
        const { data: contacts, error: contactError } = await supabase.from('contacts')
          .select('id, first_name, last_name, email').eq('user_id', user!.id)
          .in('id', (data ?? []).map(row => row.contact_id));
        if (contactError) throw contactError;
        const contactsById = new Map((contacts ?? []).map(contact => [contact.id, contact]));
        for (const row of data ?? []) {
          const parsed = pendingManualStepSchema.safeParse(row.metadata);
          if (!parsed.success) throw new Error('Etapa manual pendente com formato inválido');
          const task = parsed.data.pending_manual_step;
          const step = steps?.find(s => s.id === task.step_id);
          const contact = contactsById.get(row.contact_id);
          tasks.push({
            enrollmentId: row.id, contactId: row.contact_id,
            contactName: [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Contato indisponível',
            email: contact?.email ?? null,
            stepId: task.step_id, stepOrder: task.step_order, channel: task.channel,
            instructions: step?.notes || step?.message_template || null,
            valid: !!contact && !!step && step.channel !== 'email' &&
              step.step_order === task.step_order && step.channel === task.channel,
          });
        }
        if (!data || data.length < pageSize) return tasks;
      }
    },
    staleTime: 30_000,
  });
  const confirm = useMutation({
    mutationFn: async ({ enrollmentId, stepId, note }: { enrollmentId: string; stepId: string; note?: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await callExternalRpc<unknown>('confirm_sequence_manual_step', {
        p_enrollment_id: enrollmentId, p_step_id: stepId, p_note: note?.trim() || null,
      });
      if (error) throw error;
      return z.object({
        enrollment_id: z.string().uuid(), step_order: z.number().int(),
        status: z.string(), already_confirmed: z.boolean(),
      }).parse(data);
    },
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['sequence-manual-steps'] });
      qc.invalidateQueries({ queryKey: ['sequence-events'] });
      qc.invalidateQueries({ queryKey: ['sequences'] });
      toast.success(result.already_confirmed ? 'Execução já confirmada' : 'Execução confirmada');
    },
    onError: (error: Error) => toast.error(parseApiError(error)),
  });
  return { ...pending, confirm: confirm.mutateAsync, confirming: confirm.isPending };
}

export function useSequencePausedEmails(sequenceId: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const pending = useQuery({
    queryKey: ['sequence-paused-emails', sequenceId, user?.id],
    enabled: !!sequenceId && !!user,
    queryFn: async () => {
      const { data: steps, error: stepError } = await supabase.from('sequence_steps')
        .select('step_order, channel').eq('sequence_id', sequenceId).eq('user_id', user!.id);
      if (stepError) throw stepError;
      const rows: Array<{
        enrollmentId: string; contactId: string; contactName: string; email: string | null;
        currentStep: number; pausedAt: string | null; reason: string; valid: boolean;
      }> = [];
      const pageSize = 100;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from('sequence_enrollments')
          .select('id, contact_id, current_step, paused_at, paused_reason')
          .eq('sequence_id', sequenceId).eq('user_id', user!.id).eq('status', 'paused')
          .in('paused_reason', ['Envio não confirmado; revise a integração antes de retomar',
            'Provedor confirmou o envio; persistência ou avanço exigem revisão'])
          .order('id').range(offset, offset + pageSize - 1);
        if (error) throw error;
        if (!data?.length) return rows;
        const { data: contacts, error: contactError } = await supabase.from('contacts')
          .select('id, first_name, last_name, email').eq('user_id', user!.id).is('deleted_at', null)
          .in('id', data.map(row => row.contact_id));
        if (contactError) throw contactError;
        const contactsById = new Map((contacts ?? []).map(contact => [contact.id, contact]));
        for (const row of data) {
          const contact = contactsById.get(row.contact_id);
          rows.push({
            enrollmentId: row.id, contactId: row.contact_id,
            contactName: [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Contato indisponível',
            email: contact?.email ?? null, currentStep: row.current_step ?? 0,
            pausedAt: row.paused_at, reason: row.paused_reason ?? '',
            valid: !!contact && !!row.paused_at && row.current_step !== null &&
              !!steps?.some(step => step.step_order === row.current_step! + 1 && step.channel === 'email'),
          });
        }
        if (data.length < pageSize) return rows;
      }
    },
    staleTime: 30_000,
  });
  const resume = useMutation({
    mutationFn: async ({ enrollmentId, currentStep, pausedAt }: { enrollmentId: string; currentStep: number; pausedAt: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await callExternalRpc<unknown>('resume_sequence_email', {
        p_enrollment_id: enrollmentId, p_current_step: currentStep, p_paused_at: pausedAt,
      });
      if (error) throw error;
      const result = z.object({
        enrollment_id: z.string().uuid(), receipt_id: z.string().uuid(),
        status: z.string(), already_resumed: z.boolean(),
      }).parse(data);
      if (result.enrollment_id !== enrollmentId) throw new Error('Retomada confirmada para outra inscrição');
      return result;
    },
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['sequence-paused-emails'] });
      qc.invalidateQueries({ queryKey: ['sequence-events'] });
      qc.invalidateQueries({ queryKey: ['sequences'] });
      toast.success(result.already_resumed ? 'Solicitação de retomada já registrada' : 'Retomada registrada; aguardando processamento');
    },
    onError: (error: Error) => toast.error(parseApiError(error)),
  });
  return { ...pending, resume: resume.mutateAsync, resuming: resume.isPending };
}

export function useSequences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;

  const { data: sequences = [], isLoading, error } = useQuery({
    queryKey: ['sequences', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('sequences')
        .select('id, user_id, name, description, status, pause_on_reply, pause_on_meeting, max_enrollments, total_enrolled, total_completed, total_replied, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as Sequence[];
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
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
          step_number: i + 1,
          user_id: userId,
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
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('sequences')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', userId!)
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
      const { error } = await supabase.from('sequences').delete().eq('user_id', userId!).eq('id', id);
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
      .select('id, sequence_id, step_order, channel, delay_days, delay_hours, subject, message_template, notes, condition_type, condition_wait_hours, branch_on_yes_step, branch_on_no_step')
      .eq('sequence_id', sequenceId)
      .order('step_order')
      .limit(50);
    if (error) throw error;
    return (data || []) as unknown as SequenceStep[];
  };

  const enrollContact = useMutation({
    mutationFn: async ({ sequenceId, contactId }: { sequenceId: string; contactId: string }) => {
      if (!userId) throw new Error('Não autenticado');
      const { data, error } = await callExternalRpc<unknown>('enroll_sequence_contact', {
        _sequence_id: sequenceId, _contact_id: contactId,
      });
      if (error) throw error;
      return z.object({ id: z.string(), created: z.boolean() }).parse(data);
    },
    onSuccess: ({ created }) => {
      qc.invalidateQueries({ queryKey: ['sequences'] });
      toast.success(created ? 'Contato inscrito na sequência' : 'Contato já inscrito na sequência');
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  return {
    sequences,
    loading: isLoading,
    error,
    createSequence: createSequence.mutateAsync,
    toggleStatus: toggleStatus.mutateAsync,
    deleteSequence: deleteSequence.mutateAsync,
    fetchSteps,
    enrollContact: enrollContact.mutateAsync,
    creating: createSequence.isPending,
  };
}
