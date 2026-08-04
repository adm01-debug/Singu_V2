import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RpcPlanDiffRowRaw {
  slot: string;
  id: string;
  rpc_name: string;
  plan_hash: string;
  total_cost: number | null;
  execution_ms: number | null;
  reason: string;
  captured_at: string;
  plan: unknown;
}

export interface RpcPlanDiffPair {
  current: RpcPlanDiffRowRaw | null;
  previous: RpcPlanDiffRowRaw | null;
}

/**
 * Rodada 64/10 — dois últimos snapshots de plano de uma RPC, para diff lado a lado.
 * Admin-only via RLS na tabela `rpc_plan_snapshots` (RPC é SECURITY INVOKER).
 */
export function useRpcPlanDiff(rpcName: string | null) {
  return useQuery({
    queryKey: ['rpc-plan-diff', rpcName],
    enabled: Boolean(rpcName),
    queryFn: async (): Promise<RpcPlanDiffPair> => {
      const { data, error } = await supabase.rpc('get_rpc_plan_diff', {
        _rpc_name: rpcName as string,
      });
      if (error) throw error;
      const rows = Array.isArray(data) ? (data as unknown as RpcPlanDiffRowRaw[]) : [];
      return {
        current: rows.find((r) => r.slot === 'current') ?? null,
        previous: rows.find((r) => r.slot === 'previous') ?? null,
      };
    },
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
