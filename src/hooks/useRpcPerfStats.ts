import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RpcPerfStat {
  rpc_name: string;
  samples: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  max_ms: number;
  avg_ms: number;
  last_seen: string;
}

export interface RpcPerfPayload {
  window_hours: number;
  stats: RpcPerfStat[];
  generated_at: string;
}

export function useRpcPerfStats(hours = 24) {
  return useQuery({
    queryKey: ['rpc-perf-stats', hours],
    queryFn: async (): Promise<RpcPerfPayload> => {
      const { data, error } = await supabase.rpc('get_rpc_perf_stats', { _hours: hours });
      if (error) throw error;
      const payload = (data ?? {}) as Partial<RpcPerfPayload>;
      return {
        window_hours: payload.window_hours ?? hours,
        stats: Array.isArray(payload.stats) ? payload.stats : [],
        generated_at: payload.generated_at ?? new Date().toISOString(),
      };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}