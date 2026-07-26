import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RpcPlanSnapshotRow {
  id: string;
  rpc_name: string;
  plan_hash: string;
  total_cost: number | null;
  execution_ms: number | null;
  reason: string;
  captured_at: string;
  plan_changed: boolean | null;
}

/**
 * Histórico de planos de execução (auto-EXPLAIN) das RPCs monitoradas.
 * Admin-only via RLS + SECURITY INVOKER na RPC `get_rpc_plan_snapshots`.
 */
export function useRpcPlanSnapshots(rpcName?: string, limit = 10) {
  return useQuery({
    queryKey: ['rpc-plan-snapshots', rpcName ?? 'all', limit],
    queryFn: async (): Promise<RpcPlanSnapshotRow[]> => {
      const { data, error } = await supabase.rpc('get_rpc_plan_snapshots', {
        _rpc_name: rpcName ?? null,
        _limit: limit,
      });
      if (error) throw error;
      return Array.isArray(data) ? (data as RpcPlanSnapshotRow[]) : [];
    },
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
