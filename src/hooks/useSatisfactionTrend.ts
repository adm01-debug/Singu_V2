import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface SatisfactionTrend {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  current_satisfaction: number | null;
  current_nps: number | null;
  nps_category: string | null;
  last_survey_date: string | null;
  avg_satisfaction: number | null;
  avg_nps: number | null;
  total_surveys: number | null;
  satisfaction_trend: string | null;
  nps_alert: string | null;
}

export function useSatisfactionTrend(contactId: string | undefined) {
  return useQuery({
    queryKey: ['satisfaction-trend', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<SatisfactionTrend>({
        table: 'vw_satisfaction_trend',
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
