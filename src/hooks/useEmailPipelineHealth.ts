import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface EmailPipelineHealth {
  status: 'healthy' | 'degraded' | 'offline';
  last_email_at: string | null;
  checked_at: string;
  stats_24h: {
    total_24h: number;
    by_seller: Array<{ from_email: string; count: number }>;
  } | null;
}

async function fetchPipelineHealth(): Promise<EmailPipelineHealth> {
  const { data, error } = await supabase.functions.invoke('email-pipeline-health');
  if (error) throw error;
  return data as EmailPipelineHealth;
}

export function useEmailPipelineHealth(enabled = true) {
  return useQuery({
    queryKey: ['email-pipeline-health'],
    queryFn: fetchPipelineHealth,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRefreshPipelineHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fetchPipelineHealth,
    onSuccess: (data) => {
      qc.setQueryData(['email-pipeline-health'], data);
    },
    onError: (err) => {
      logger.error('Erro ao verificar pipeline de email:', err);
    },
  });
}
