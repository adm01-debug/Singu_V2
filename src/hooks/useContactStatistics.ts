import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface ContactStatistics {
  total_interactions: number;
  total_deals: number;
  total_meetings: number;
  total_proposals: number;
  total_tasks: number;
  open_deals_value: number;
  won_deals_value: number;
  avg_response_time_hours: number | null;
  last_interaction_at: string | null;
  days_since_last_contact: number | null;
  nps_score: number | null;
  churn_risk: string | null;
}

export function useContactStatistics(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-statistics', user?.id, contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ContactStatistics>(
        'get_contact_statistics',
        { p_contact_id: contactId, p_user_id: user!.id }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
