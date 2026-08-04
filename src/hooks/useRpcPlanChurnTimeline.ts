import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RpcPlanChurnTimelinePoint {
  bucket: string;
  plan_changes: number;
  samples: number;
  p95_ms: number;
}

/**
 * Rodada 68/10 — série horária correlacionando trocas de plano com o p95 observado.
 * Admin-only: a RPC é SECURITY INVOKER e depende das RLS de
 * `rpc_plan_snapshots` / `rpc_perf_samples`.
 */
export function useRpcPlanChurnTimeline(rpcName: string | null, hours = 24, enabled = true) {
  return useQuery({
    queryKey: ['rpc-plan-churn-timeline', rpcName ?? 'all', hours],
    enabled,
    queryFn: async (): Promise<RpcPlanChurnTimelinePoint[]> => {
      const { data, error } = await supabase.rpc('get_rpc_plan_churn_timeline', {
        _rpc_name: rpcName,
        _hours: hours,
      });
      if (error) throw error;
      if (!Array.isArray(data)) return [];
      return (data as RpcPlanChurnTimelinePoint[]).map((p) => ({
        bucket: p.bucket,
        plan_changes: Number(p.plan_changes ?? 0),
        samples: Number(p.samples ?? 0),
        p95_ms: Number(p.p95_ms ?? 0),
      }));
    },
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
}
