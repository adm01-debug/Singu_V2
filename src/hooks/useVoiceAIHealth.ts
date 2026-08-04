import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface VoiceServiceCheck {
  service: string;
  status: 'ok' | 'error';
  latency_ms: number;
  error?: string;
}

export interface VoiceAIHealth {
  status: 'healthy' | 'degraded';
  checked_at: string;
  services: VoiceServiceCheck[];
  total_latency_ms: number;
}

async function fetchVoiceHealth(): Promise<VoiceAIHealth> {
  const { data, error } = await supabase.functions.invoke('voice-ai-health');
  if (error) throw error;
  return data as VoiceAIHealth;
}

export function useVoiceAIHealth(enabled = true) {
  return useQuery({
    queryKey: ['voice-ai-health'],
    queryFn: fetchVoiceHealth,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRefreshVoiceHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fetchVoiceHealth,
    onSuccess: (data) => {
      qc.setQueryData(['voice-ai-health'], data);
    },
    onError: (err) => {
      logger.error('Erro ao verificar Voice AI:', err);
    },
  });
}
