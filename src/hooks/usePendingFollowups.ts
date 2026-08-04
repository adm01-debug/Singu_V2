import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface PendingFollowup {
  interaction_id: string;
  contact_id: string;
  contact_name: string;
  contact_email: string | null;
  company_name: string | null;
  interaction_title: string | null;
  interaction_type: string | null;
  follow_up_date: string | null;
  follow_up_notes: string | null;
  owner_name: string | null;
  owner_email: string | null;
  followup_status: string | null;
  days_overdue: number | null;
  priority: string | null;
  contact_disc: string | null;
  closing_score: number | null;
}

export function usePendingFollowups(limit = 20) {
  return useQuery({
    queryKey: ['pending-followups', limit],
    queryFn: async () => {
      const { data, error } = await queryExternalData<PendingFollowup>({
        table: 'vw_pending_followups',
        order: { column: 'days_overdue', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
