import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  total_interactions: number;
  deals_created: number;
  deals_won: number;
  deals_lost: number;
  revenue: number;
  conversion_rate: number;
  top_performers: Array<{ user_id: string; name: string; score: number }>;
  highlights: string[];
}

export function useWeeklySummary() {
  return useQuery({
    queryKey: ['weekly-summary'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<WeeklySummary>(
        'get_weekly_summary',
        {}
      );
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
}
