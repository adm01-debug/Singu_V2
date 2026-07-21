import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CRMAlert {
  id: string;
  type: 'at_risk' | 'no_contact' | 'follow_up';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggested_action: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export function useCRMAlerts(contactId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['crm-alerts', contactId, user?.id],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_alerts')
        .select('id, type, severity, message, suggested_action, is_resolved, created_at, resolved_at')
        .eq('contact_id', contactId)
        .eq('user_id', user!.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CRMAlert[];
    },
    enabled: !!user && !!contactId,
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('crm_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-alerts', contactId, user?.id] });
      toast.success('Alerta resolvido');
    },
    onError: () => toast.error('Erro ao resolver alerta'),
  });

  return {
    alerts,
    isLoading,
    resolveAlert: resolveAlert.mutate,
  };
}
