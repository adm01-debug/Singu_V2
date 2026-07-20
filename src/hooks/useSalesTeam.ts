import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { SalesTeamMember, SalesRole } from '@/types/leadRouting';

const QUERY_KEY_BASE_BASE = ['sales-team-members'];

export function useSalesTeam() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...QUERY_KEY_BASE_BASE, user?.id],
    queryFn: async (): Promise<SalesTeamMember[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('sales_team_members')
        .select('*')
        .order('role', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        logger.error('Erro ao carregar equipe:', error);
        throw error;
      }
      return (data ?? []) as unknown as SalesTeamMember[];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}

export function useCreateTeamMember() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (member: Partial<SalesTeamMember>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('sales_team_members')
        .insert({ ...member, user_id: user.id } as never)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao adicionar membro à equipe');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BASE });
      toast.success('Membro adicionado à equipe');
    },
    onError: () => toast.error('Erro ao adicionar membro'),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalesTeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_team_members')
        .update(updates as never)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Membro não encontrado');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BASE });
      toast.success('Membro atualizado');
    },
    onError: () => toast.error('Erro ao atualizar membro'),
  });
}

export function useDeleteTeamMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_team_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BASE });
      toast.success('Membro removido da equipe');
    },
    onError: () => toast.error('Erro ao remover membro'),
  });
}

export function useActiveTeamByRole(role?: SalesRole) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sales-team-active', role, user?.id],
    queryFn: async (): Promise<SalesTeamMember[]> => {
      if (!user) return [];
      let query = supabase
        .from('sales_team_members')
        .select('*')
        .eq('is_active', true);

      if (role) query = query.eq('role', role);

      const { data, error } = await query.order('last_assigned_at', { ascending: true, nullsFirst: true });
      if (error) throw error;

      const now = new Date();
      return ((data ?? []) as unknown as SalesTeamMember[]).filter((m) => {
        if (m.vacation_start && m.vacation_end) {
          const start = new Date(m.vacation_start);
          const end = new Date(m.vacation_end);
          if (now >= start && now <= end) return false;
        }
        return true;
      });
    },
    enabled: !!user,
    staleTime: 2 * 60_000,
  });
}
