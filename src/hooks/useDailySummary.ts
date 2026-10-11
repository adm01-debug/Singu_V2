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
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const targetDate = date || `${parts.year}-${parts.month}-${parts.day}`;
  return useQuery({
    queryKey: ['daily-summary', targetDate, user?.id, timeZone],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<DailySummary>(
        'get_daily_summary',
        { p_date: targetDate, p_timezone: timeZone }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000,
  });
}
