import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface DailySummary {
  date: string;
  interactions_count: number;
  deals_created: number;
  deals_won: number;
  deals_lost: number;
  revenue: number;
  new_companies: number;
  new_contacts: number;
  followups_completed: number;
  followups_pending: number;
}

export function useDailySummary(date?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily-summary', date, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const targetDate = date || new Date().toISOString().split('T')[0];
      const { data, error } = await callExternalRpc<DailySummary>(
        'get_daily_summary',
        { p_date: targetDate }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
