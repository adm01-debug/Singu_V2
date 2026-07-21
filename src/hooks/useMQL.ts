import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface MQLCriteria {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  conditions: { min_score?: number; required_tags?: string[]; intent_signals?: string[] };
  is_active: boolean;
  auto_handoff: boolean;
  handoff_to_role: 'sdr' | 'closer' | 'manager';
  priority: number;
  created_at: string;
}

export interface MQLClassification {
  id: string;
  user_id: string;
  contact_id: string;
  criteria_id: string | null;
  status: 'mql' | 'sql' | 'disqualified' | 'customer';
  qualified_at: string;
  handoff_to: string | null;
  handoff_at: string | null;
  score_snapshot: number | null;
  reason: string | null;
  notes: string | null;
}

export function useMQLCriteria() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const KEY = ['mql-criteria', user?.id];

  const { data: criteria = [], isLoading } = useQuery({
    queryKey: KEY,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('mql_criteria').select('*').eq('user_id', user.id).order('priority', { ascending: false })
      .limit(1000);
      if (error) throw error;
      return (data || []) as unknown as MQLCriteria[];
    },
    staleTime: 60_000,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<MQLCriteria> & { name: string }) => {
      if (!user) throw new Error('Não autenticado');
      if (input.id) {
        const { error } = await supabase.from('mql_criteria').update(input as TablesUpdate<'mql_criteria'>).eq('user_id', user.id).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mql_criteria').insert({ ...input, user_id: user.id } as TablesInsert<'mql_criteria'>);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Critério salvo!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mql_criteria').delete().eq('user_id', user!.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error('Erro ao remover critério'),
  });

  return { criteria, isLoading, upsert, remove };
}

export function useMQLClassifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['mql-classifications', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('mql_classifications')
        .select('*')
        .eq('user_id', user.id)
        .order('qualified_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as MQLClassification[];
    },
    staleTime: 60_000,
  });
}

export function useEvaluateMQL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact_id: string) => {
      const { data, error } = await supabase.rpc('evaluate_mql', { _contact_id: contact_id });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mql-classifications'] });
      const d = data as { qualified?: boolean; score?: number };
      if (d?.qualified) toast.success(`MQL qualificado! Score ${d.score}`);
      else toast.info(`Ainda não qualificado (score ${d?.score ?? 0})`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHandoffMQL() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, to, status = 'sql' }: { id: string; to?: string; status?: 'sql' | 'disqualified' }) => {
      const { error } = await supabase.from('mql_classifications').update({
        status,
        handoff_to: to ?? null,
        handoff_at: new Date().toISOString(),
      } as TablesUpdate<'mql_classifications'>).eq('user_id', user!.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mql-classifications'] }); toast.success('Handoff registrado'); },
    onError: (e: Error) => toast.error(e.message),
  });
}
