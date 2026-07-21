import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type ErrorLog = Database['public']['Tables']['error_logs']['Row'];

export function useErrorLogs() {
  const queryClient = useQueryClient();

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Erro ao buscar logs do banco:', { error: msg });
      throw error;
    }

    return data || [];
  };

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['admin', 'error-logs'],
    queryFn: fetchLogs,
    staleTime: 30000, // 30 segundos
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      // Nota: deletar logs geralmente exige permissão admin
      // Vamos assumir que a política RLS DELETE já cobre isso se o usuário for admin
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'error-logs'] });
      toast.success('Logs limpos');
    },
    onError: () => toast.error('Erro ao limpar logs'),
  });

  return {
    logs,
    isLoading,
    refetch,
    clearLogs: clearLogsMutation.mutateAsync,
    isClearing: clearLogsMutation.isPending
  };
}
