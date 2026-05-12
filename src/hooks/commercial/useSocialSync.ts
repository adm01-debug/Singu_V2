import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSocialSync(contactId: string) {
  const queryClient = useQueryClient();

  const { data: queueStatus, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['social-sync-queue', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_sync_queue')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['psychographic-audit-log', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychographic_audit_log')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const syncNow = useMutation({
    mutationFn: async () => {
      const { data: queueItem, error: queueError } = await supabase
        .from('social_sync_queue')
        .insert({
          contact_id: contactId,
          status: 'pending',
          retry_count: 0
        })
        .select()
        .single();

      if (queueError) throw queueError;

      const { error: funcError } = await supabase.functions.invoke('sync-social-interests', {
        body: { contactId, queueId: queueItem.id }
      });

      if (funcError) {
        await supabase.from('social_sync_queue')
          .update({ status: 'failed', error_log: funcError.message, last_attempt: new Date().toISOString() })
          .eq('id', queueItem.id);
        throw funcError;
      }

      return queueItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-sync-queue', contactId] });
      queryClient.invalidateQueries({ queryKey: ['offer-suggestions-elite', contactId] });
      queryClient.invalidateQueries({ queryKey: ['psychographic-audit-log', contactId] });
      toast.success('Sincronização agendada com sucesso');
    },
    onError: (error: any) => {
      toast.error(`Falha ao iniciar sincronização: ${error.message}`);
    }
  });

  return {
    queueStatus,
    auditLogs,
    syncNow,
    isLoading: isLoadingQueue || isLoadingAudit
  };
}
