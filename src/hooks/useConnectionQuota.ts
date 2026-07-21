import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export interface ConnectionQuota {
  id: string;
  webhook_id: string;
  period_start: string;
  calls_limit: number;
  calls_used: number;
  overage_blocked: boolean;
  alert_sent_80: boolean;
}

export function useConnectionQuota(webhookId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['connection_quota', webhookId],
    enabled: !!webhookId,
    staleTime: 30_000,
    queryFn: async () => {
      const period = new Date();
      period.setDate(1);
      const periodStr = period.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('connection_quotas')
        .select('id, webhook_id, period_start, calls_limit, calls_used, overage_blocked, alert_sent_80')
        .eq('webhook_id', webhookId!)
        .eq('period_start', periodStr)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ConnectionQuota | null;
    },
  });

  const updateLimit = useMutation({
    mutationFn: async ({ webhook_id, calls_limit, overage_blocked }: {
      webhook_id: string;
      calls_limit: number;
      overage_blocked: boolean;
    }) => {
      const period = new Date();
      period.setDate(1);
      const periodStr = period.toISOString().slice(0, 10);
      const { error } = await supabase
        .from('connection_quotas')
        .upsert({
          webhook_id,
          period_start: periodStr,
          calls_limit,
          overage_blocked,
        }, { onConflict: 'webhook_id,period_start' });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['connection_quota', v.webhook_id] });
      toast.success('Quota atualizada');
    },
    onError: (e) => toast.error(`Erro: ${parseApiError(e)}`),
  });

  return { ...query, updateLimit };
}
