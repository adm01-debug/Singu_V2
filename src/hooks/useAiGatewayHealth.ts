import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AiGatewayFunctionRow {
  function_name: string;
  requests: number;
  errors: number;
  error_rate_pct: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  last_seen: string;
}

export interface AiGatewayHealth {
  window_hours: number;
  computed_at: string;
  totals: {
    requests?: number;
    errors?: number;
    error_rate_pct?: number | null;
    p50_ms?: number | null;
    p95_ms?: number | null;
    p99_ms?: number | null;
  };
  by_function: AiGatewayFunctionRow[];
}

export function useAiGatewayHealth(hours = 24) {
  return useQuery({
    queryKey: ['ai-gateway-health', hours],
    queryFn: async (): Promise<AiGatewayHealth> => {
      const { data, error } = await supabase.rpc('get_ai_gateway_health', { _hours: hours });
      if (error) throw error;
      return data as unknown as AiGatewayHealth;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}