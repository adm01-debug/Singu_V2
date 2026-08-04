import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type DISCCommLog = Tables<'disc_communication_logs'>;

export function useDISCCommunicationLogs(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['disc-comm-logs', contactId, user?.id];

  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disc_communication_logs')
        .select('*')
        .eq('contact_id', contactId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const logMutation = useMutation({
    mutationFn: async (log: Omit<TablesInsert<'disc_communication_logs'>, 'user_id'>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('disc_communication_logs')
        .insert({ ...log, user_id: user!.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao registrar log DISC');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Log de comunicação DISC registrado');
    },
    onError: (err) => {
      logger.error('Error logging DISC communication:', err);
      toast.error('Erro ao registrar comunicação');
    },
  });

  const logCommunication = useCallback(async (log: Omit<TablesInsert<'disc_communication_logs'>, 'user_id'>) => {
    return logMutation.mutateAsync(log);
  }, [logMutation]);

  const avgEffectiveness = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.effectiveness_rating || 0), 0) / (logs.filter(l => l.effectiveness_rating).length || 1))
    : null;

  const adaptationRate = logs.length > 0
    ? Math.round((logs.filter(l => l.approach_adapted).length / logs.length) * 100)
    : 0;

  return { logs, loading, logCommunication, avgEffectiveness, adaptationRate, refresh: () => queryClient.invalidateQueries({ queryKey }) };
}
