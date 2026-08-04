import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConnectionMetrics {
  p50: number;
  p95: number;
  p99: number;
  success_rate: number;
  total_calls: number;
  failures: number;
}

export interface SparklinePoint {
  ts: string;
  latency: number;
  ok: boolean;
}

/**
 * Métricas P50/P95/P99 + sparkline dos últimos 7d para uma conexão.
 */
export function useConnectionMetrics(connectionId: string | undefined) {
  return useQuery({
    queryKey: ['connection_metrics', connectionId],
    enabled: !!connectionId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!connectionId) throw new Error('id obrigatório');

      const [{ data: rpcData, error: rpcErr }, { data: logs, error: logsErr }] = await Promise.all([
        supabase.rpc('get_connection_metrics', { _connection_id: connectionId }),
        supabase
          .from('connection_test_logs')
          .select('created_at, latency_ms, status')
          .eq('connection_id', connectionId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (rpcErr) throw rpcErr;
      if (logsErr) throw logsErr;

      const metrics = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as ConnectionMetrics | null;

      const sparkline: SparklinePoint[] = (logs ?? [])
        .slice()
        .reverse()
        .map((l) => ({
          ts: l.created_at,
          latency: l.latency_ms ?? 0,
          ok: l.status === 'success',
        }));

      return {
        metrics: metrics ?? {
          p50: 0, p95: 0, p99: 0, success_rate: 100, total_calls: 0, failures: 0,
        },
        sparkline,
      };
    },
  });
}
