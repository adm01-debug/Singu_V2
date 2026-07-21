import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';

export function useSocialSync(contactId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: queueStatus, isLoading: isLoadingQueue } = useQuery({
    queryKey: ['social-sync-queue', contactId, user?.id],
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
    enabled: !!contactId && !!user,
    staleTime: 2 * 60 * 1000,
  });

  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['psychographic-audit-log', contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychographic_audit_log')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      return data;
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
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
        .maybeSingle();

      if (queueError) throw queueError;

      // Retry logic for function invocation
      let funcError = null;
      let attempts = 0;
      const maxRetries = 3;

      while (attempts < maxRetries) {
        const { error } = await supabase.functions.invoke('sync-social-interests', {
          body: { contactId, queueId: queueItem.id }
        });
        
        if (!error) {
          funcError = null;
          break;
        }
        
        funcError = error;
        attempts++;
        
        if (attempts < maxRetries) {
          const { error: retryErr } = await supabase.from('social_sync_queue')
            .update({
              retry_count: attempts,
              error_log: `Falha na tentativa ${attempts}: ${error.message}`,
              last_attempt: new Date().toISOString()
            })
            .eq('id', queueItem.id);
          if (retryErr) logger.warn('Failed to update social_sync_queue retry', { error: retryErr.message });
            
          // Exponential backoff wait (simple version)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }

      if (funcError) {
        const { error: failErr } = await supabase.from('social_sync_queue')
          .update({ status: 'failed', error_log: funcError.message, last_attempt: new Date().toISOString() })
          .eq('id', queueItem.id);
        if (failErr) logger.warn('Failed to update social_sync_queue status to failed', { error: failErr.message });
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
    onError: (error: Error) => {
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
