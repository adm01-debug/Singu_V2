import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json, TablesUpdate } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

export interface NurturingStep {
  type: 'email' | 'whatsapp' | 'task' | 'wait';
  delay_days: number;
  subject?: string;
  content?: string;
  template_id?: string;
}

export interface NurturingWorkflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  steps: NurturingStep[];
  enrolled_count: number;
  completed_count: number;
  created_at: string;
}

export interface NurturingEnrollment {
  id: string;
  workflow_id: string;
  contact_id: string;
  current_step: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  enrolled_at: string;
  next_action_at: string | null;
}

export function useNurturingWorkflows() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['nurturing-workflows', user?.id];

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('nurturing_workflows').select('id, user_id, name, description, trigger_type, trigger_config, is_active, steps, enrolled_count, completed_count, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
      .limit(200);
      if (error) throw error;
      return (data || []).map(d => ({ ...d, steps: Array.isArray(d.steps) ? d.steps : [] })) as unknown as NurturingWorkflow[];
    },
    staleTime: 3 * 60_000,
    refetchOnWindowFocus: false,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; description?: string; trigger_type?: string; steps?: NurturingStep[] }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('nurturing_workflows').insert({
        user_id: user.id, name: input.name, description: input.description || null,
        trigger_type: input.trigger_type || 'manual', steps: (input.steps || []) as unknown as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Workflow criado!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NurturingWorkflow> & { id: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('nurturing_workflows').update(updates as unknown as TablesUpdate<'nurturing_workflows'>).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Workflow atualizado!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('nurturing_workflows').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Workflow removido!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('nurturing_workflows').update({ is_active }).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); },
    onError: () => toast.error('Erro ao atualizar workflow'),
  });

  return { workflows, isLoading, create, update, remove, toggleActive };
}
