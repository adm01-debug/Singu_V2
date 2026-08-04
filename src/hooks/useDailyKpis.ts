import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface DailyKpi {
  snapshot_date?: string;
  total_companies?: number;
  total_contacts?: number;
  total_customers?: number;
  active_customers?: number;
  total_revenue?: number;
  interactions_today?: number;
  total_salespeople?: number;
}

export interface DailyStats {
  stats_date?: string;
  total_companies?: number;
  total_contacts?: number;
  open_deals?: number;
  pipeline_value?: number;
  monthly_deals_won?: number;
  monthly_revenue?: number;
  monthly_interactions?: number;
  monthly_proposals?: number;
  overdue_tasks?: number;
  overdue_followups?: number;
  calculated_at?: string;
}

export function useDailyKpis() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily-kpis-v2', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await queryExternalData<DailyKpi>({
        table: 'mv_daily_kpis',
        order: { column: 'snapshot_date', ascending: false },
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useDailyStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await queryExternalData<DailyStats>({
        table: 'mv_daily_stats',
        order: { column: 'stats_date', ascending: false },
        range: { from: 0, to: 29 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}
