import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';

export interface SchemaDriftAlert {
  id: string;
  error_type: string;
  entity_type: string;
  entity_name: string;
  error_message: string | null;
  stack_trace: string | null;
  user_id: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export function useSchemaDriftAlerts(onlyUnresolved = true) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['schema-drift-alerts', onlyUnresolved, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('schema_drift_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (onlyUnresolved) {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as SchemaDriftAlert[];
    },
    enabled: !!user && isAdmin,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useUnresolvedDriftCount() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ['schema-drift-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('schema_drift_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false);

      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user && isAdmin,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useResolveDriftAlert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('schema_drift_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        } as Record<string, unknown>)
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schema-drift-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['schema-drift-count'] });
      toast.success('Alerta resolvido');
    },
    onError: () => toast.error('Erro ao resolver alerta de drift'),
  });
}
