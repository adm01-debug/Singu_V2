import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface InactivityAlert {
  id: string;
  contact_id: string;
  alert_type?: string;
  days_inactive?: number;
  last_interaction_at?: string;
  severity?: string;
  title?: string;
  description?: string;
  dismissed?: boolean;
  created_at: string;
}

export function useInactivityAlerts(contactId?: string) {
  return useQuery({
    queryKey: ['inactivity-alerts', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<InactivityAlert>({
        table: 'inactivity_alerts',
        select: '*',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
  });
}
