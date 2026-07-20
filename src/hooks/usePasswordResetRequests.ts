import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function usePasswordResetRequests() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['password-reset-requests', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) return [];
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ status: 'approved', approved_by: user?.id, resolved_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Reset aprovado.'); qc.invalidateQueries({ queryKey: ['password-reset-requests'] }); },
    onError: () => toast.error('Erro ao aprovar reset.'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ status: 'rejected', approved_by: user?.id, reason, resolved_at: new Date().toISOString() })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Reset rejeitado.'); qc.invalidateQueries({ queryKey: ['password-reset-requests'] }); },
    onError: () => toast.error('Erro ao rejeitar reset.'),
  });

  return { requests, isLoading, approve: approveMutation.mutate, reject: rejectMutation.mutate };
}
