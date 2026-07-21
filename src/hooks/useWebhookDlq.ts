import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { parseApiError } from '@/lib/errorMessages';

export interface DlqItem {
  id: string;
  webhook_id: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
  status: string;
  next_retry_at: string;
  last_error: string | null;
  created_at: string;
  resolved_at: string | null;
  source_ip: string | null;
}

export function useWebhookDlq() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['incoming_webhook_dlq', user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_webhook_dlq')
        .select('*')
        .in('status', ['pending', 'processing', 'failed'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as DlqItem[];
    },
  });

  const reprocess = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('process-webhook-dlq', {
        body: { id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Reprocessamento agendado');
      qc.invalidateQueries({ queryKey: ['incoming_webhook_dlq'] });
    },
    onError: (e: Error) => toast.error('Falha ao reprocessar', { description: parseApiError(e) }),
  });

  const reprocessAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-webhook-dlq', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { processed?: number } | null) => {
      toast.success(`${data?.processed ?? 0} itens processados`);
      qc.invalidateQueries({ queryKey: ['incoming_webhook_dlq'] });
    },
    onError: (e: Error) => toast.error('Falha ao reprocessar lote', { description: parseApiError(e) }),
  });

  return { items, isLoading, reprocess, reprocessAll };
}
