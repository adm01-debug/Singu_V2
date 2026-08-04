import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface ContactEffectiveness {
  overall_score: number;
  conversion_rate: number;
  avg_deal_size: number;
  avg_sales_cycle_days: number;
  response_rate: number;
  meeting_to_deal_ratio: number;
  best_channel: string | null;
  best_time_slot: string | null;
  recommendations: string[];
}

export function useContactEffectiveness(contactId?: string) {
  return useQuery({
    queryKey: ['contact-effectiveness', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ContactEffectiveness>(
        'get_contact_effectiveness',
        { p_contact_id: contactId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}
