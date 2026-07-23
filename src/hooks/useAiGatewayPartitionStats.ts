import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AiGatewayPartitionStat {
  partition_name: string;
  range_start: string;
  range_end: string;
  estimated_rows: number;
  total_bytes: number;
  min_created_at: string | null;
  max_created_at: string | null;
  is_current: boolean;
  is_future: boolean;
  is_expiring: boolean;
}

export function useAiGatewayPartitionStats() {
  return useQuery({
    queryKey: ['ai-gateway-partition-stats'],
    queryFn: async (): Promise<AiGatewayPartitionStat[]> => {
      const { data, error } = await supabase.rpc('get_ai_gateway_partition_stats');
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as AiGatewayPartitionStat[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}