import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export interface NurturingExecution {
  id: string;
  workflow_id: string;
  contact_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';
  next_action_at: string | null;
  last_action_at: string | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export function useNurturingExecutions(workflowId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['nurturing-executions', workflowId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from('nurturing_executions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(200);
      if (workflowId) q = q.eq('workflow_id', workflowId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as NurturingExecution[];
    },
    staleTime: 30_000,
  });
}

export function useEnrollContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workflow_id, contact_id }: { workflow_id: string; contact_id: string }) => {
      const { data, error } = await supabase.rpc('enroll_contact_in_workflow', { _workflow_id: workflow_id, _contact_id: contact_id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['nurturing-executions'] }); toast.success('Contato enrolado no workflow'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

export function useRunNurturing() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('nurturing-runner', { body: {} });
      if (error) throw error;
      return data as { ok: boolean; stats: Record<string, number> };
    },
    onSuccess: (d) => toast.success(`Runner OK: ${d.stats.processed} processados, ${d.stats.advanced} avançados`),
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}
