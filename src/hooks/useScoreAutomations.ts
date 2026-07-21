import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

export type AutomationTrigger = 'grade_reached' | 'grade_dropped' | 'score_above' | 'score_below';
export type AutomationAction = 'notify' | 'create_task' | 'enroll_sequence' | 'webhook' | 'tag';

export interface ScoreAutomation {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: AutomationTrigger;
  grade_target: 'A' | 'B' | 'C' | 'D' | null;
  score_target: number | null;
  action_type: AutomationAction;
  action_config: Record<string, unknown>;
  cooldown_hours: number;
  active: boolean;
  last_fired_at: string | null;
  fired_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationLogRow {
  id: string;
  automation_id: string;
  contact_id: string;
  from_grade: string | null;
  to_grade: string | null;
  from_score: number | null;
  to_score: number | null;
  action_result: Record<string, unknown>;
  success: boolean;
  fired_at: string;
}

const STALE = 60_000;

export function useScoreAutomations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['score-automations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('lead_score_threshold_automations')
        .select('id, user_id, name, description, trigger_type, grade_target, score_target, action_type, action_config, cooldown_hours, active, last_fired_at, fired_count, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as ScoreAutomation[];
    },
    enabled: !!user?.id,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });
}

export function useUpsertAutomation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ScoreAutomation> & { name: string; trigger_type: AutomationTrigger; action_type: AutomationAction }) => {
      if (!user?.id) throw new Error('not authenticated');
      const payload = {
        user_id: user.id,
        name: input.name,
        description: input.description ?? null,
        trigger_type: input.trigger_type,
        grade_target: input.grade_target ?? null,
        score_target: input.score_target ?? null,
        action_type: input.action_type,
        action_config: (input.action_config ?? {}) as unknown as Json,
        cooldown_hours: input.cooldown_hours ?? 24,
        active: input.active ?? true,
      };
      if (!user) throw new Error('Não autenticado');
      if (input.id) {
        const { error } = await supabase.from('lead_score_threshold_automations').update(payload).eq('user_id', user.id).eq('id', input.id);
        if (error) throw error;
        return { id: input.id };
      }
      const { data, error } = await supabase.from('lead_score_threshold_automations').insert(payload).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar automação de score');
      return { id: data.id };
    },
    onSuccess: () => {
      toast.success('Automação salva');
      qc.invalidateQueries({ queryKey: ['score-automations'] });
    },
    onError: (e) => toast.error(parseApiError(e)),
  });
}

export function useToggleAutomation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('lead_score_threshold_automations').update({ active }).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['score-automations'] }),
    onError: (e) => toast.error(parseApiError(e)),
  });
}

export function useDeleteAutomation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('lead_score_threshold_automations').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Automação removida');
      qc.invalidateQueries({ queryKey: ['score-automations'] });
    },
    onError: (e) => toast.error(parseApiError(e)),
  });
}

export function useAutomationLog(automationId?: string, days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['score-automation-log', automationId, days, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const since = new Date(Date.now() - days * 86_400_000).toISOString();
      let q = supabase
        .from('lead_score_threshold_log')
        .select('id, automation_id, contact_id, from_grade, to_grade, from_score, to_score, action_result, success, fired_at')
        .eq('user_id', user.id)
        .gte('fired_at', since)
        .order('fired_at', { ascending: false })
        .limit(200);
      if (automationId) q = q.eq('automation_id', automationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AutomationLogRow[];
    },
    enabled: !!user?.id,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });
}
