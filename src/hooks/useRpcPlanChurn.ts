import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RpcPlanChurnRow {
  rpc_name: string;
  changes: number;
  last_change: string;
}

/**
 * Rodada 66/10 — contagem de trocas de plano por RPC numa janela de horas.
 * Admin-only via RLS (SECURITY INVOKER em `get_rpc_plan_change_counts`).
 */
export function useRpcPlanChurn(hours = 6) {
  return useQuery({
    queryKey: ['rpc-plan-churn', hours],
    queryFn: async (): Promise<RpcPlanChurnRow[]> => {
      const { data, error } = await supabase.rpc('get_rpc_plan_change_counts', { _hours: hours });
      if (error) throw error;
      if (!Array.isArray(data)) return [];
      return (data as RpcPlanChurnRow[]).map((r) => ({
        rpc_name: r.rpc_name,
        changes: Number(r.changes ?? 0),
        last_change: r.last_change,
      }));
    },
    staleTime: 120_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: false,
  });
}
