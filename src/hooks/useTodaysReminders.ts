import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface TodaysReminder {
  id: string;
  user_id: string;
  reminder_type: string | null;
  title: string;
  description: string | null;
  remind_at: string | null;
  priority: string | null;
  contact_id: string | null;
  contact_name: string | null;
  company_id: string | null;
  company_name: string | null;
  suggested_actions: string[] | null;
  status: string | null;
  minutes_until: number | null;
  time_status: string | null;
  priority_icon: string | null;
}

export function useTodaysReminders() {
  return useQuery({
    queryKey: ['todays-reminders'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<TodaysReminder>({
        table: 'vw_todays_reminders',
        order: { column: 'remind_at', ascending: true },
        range: { from: 0, to: 19 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
