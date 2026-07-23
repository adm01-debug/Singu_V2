import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SlowRpcTrendRow {
  rpc_name: string;
  samples_recent: number;
  samples_baseline: number;
  p95_recent_ms: number;
  p95_baseline_ms: number;
  ratio: number | null;
  is_degraded: boolean;
}

export function useSlowRpcTrend(limit = 5) {
  return useQuery({
    queryKey: ['slow-rpc-trend', limit],
    queryFn: async (): Promise<SlowRpcTrendRow[]> => {
      const { data, error } = await supabase.rpc('get_slow_rpc_trend', {
        _hours_recent: 1,
        _hours_baseline: 24,
        _limit: limit,
      });
      if (error) throw error;
      return Array.isArray(data) ? (data as SlowRpcTrendRow[]) : [];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}