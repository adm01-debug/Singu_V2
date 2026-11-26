import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface CoachingSuggestion {
  area: string;
  current_status: string;
  suggestion: string;
  priority: string;
}

export interface BenchmarkSide {
  avg_cycle: number | null;
  avg_ticket: number | null;
  conversion_rate: number | null;
  monthly_interactions: number | null;
}

export interface PerformanceBenchmark {
  position: {
    rank_revenue: number | null;
    rank_conversion: number | null;
  };
  team_avg: BenchmarkSide;
  user_metrics: BenchmarkSide;
}

export function useCoachingSuggestions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seller-coaching', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<CoachingSuggestion[]>('get_coaching_suggestions', { p_user_id: user!.id });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function usePerformanceBenchmark() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seller-benchmark', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<PerformanceBenchmark>('get_performance_benchmark', { p_user_id: user!.id });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
}