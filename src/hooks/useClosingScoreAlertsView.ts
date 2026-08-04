import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ClosingScoreAlert {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  closing_score: number | null;
  previous_score: number | null;
  score_change: number | null;
  measured_at: string | null;
  temperature: string | null;
  action_alert: string | null;
  days_since_last_contact: number | null;
  priority: string | null;
}

export function useClosingScoreAlertsView(contactId: string | undefined) {
  return useQuery({
    queryKey: ['closing-score-alerts-view', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ClosingScoreAlert>({
        table: 'vw_closing_score_alerts',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
