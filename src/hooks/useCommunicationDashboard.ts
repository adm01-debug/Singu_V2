import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface CommunicationDashboard {
  contact_id: string;
  contact_name: string;
  company_name: string | null;
  disc_type: string | null;
  vak_type: string | null;
  eq_level: string | null;
  pace: string | null;
  tone: string | null;
  decision_style: string | null;
  rapport_score: number | null;
  rapport_level: string | null;
  interests_count: number | null;
  approach_summary: string | null;
  communication_action: string | null;
}

export function useCommunicationDashboard(contactId: string | undefined) {
  return useQuery({
    queryKey: ['communication-dashboard', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<CommunicationDashboard>({
        table: 'vw_communication_dashboard',
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
