import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

interface BestContactTime {
  day_of_week?: number;
  hour_of_day?: number;
  success_rate?: number;
  suggested_channel?: string;
  avg_response_time_minutes?: number;
  [key: string]: unknown;
}

export function useBestContactTime(contactId: string, enabled = true) {
  return useQuery({
    queryKey: ['best-contact-time', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<BestContactTime | BestContactTime[]>(
        'get_best_contact_time',
        { p_contact_id: contactId }
      );
      if (error) throw error;
      if (Array.isArray(data)) return data[0] || null;
      return data;
    },
    enabled: enabled && !!contactId,
    staleTime: 10 * 60 * 1000,
  });
}
