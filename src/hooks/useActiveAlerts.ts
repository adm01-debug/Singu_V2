import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ActiveAlert {
  id: string;
  alert_type: string;
  contact_id: string | null;
  contact_name: string | null;
  company_id: string | null;
  company_name: string | null;
  days_inactive: number | null;
  last_interaction_date: string | null;
  severity: string | null;
  risk_score: number | null;
  recommended_actions: string[] | null;
  urgency_reason: string | null;
  status: string | null;
  detected_at: string | null;
  severity_label: string | null;
  type_label: string | null;
}

export function useActiveAlerts() {
  return useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ActiveAlert>({
        table: 'vw_active_alerts',
        order: { column: 'detected_at', ascending: false },
        range: { from: 0, to: 19 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
