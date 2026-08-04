import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface EngagementScore {
  score: number;
  level: string;
  factors: {
    recency: number;
    frequency: number;
    depth: number;
    responsiveness: number;
  };
  trend: 'rising' | 'stable' | 'declining';
  last_calculated_at: string;
}

export function useContactEngagement(contactId?: string) {
  return useQuery({
    queryKey: ['contact-engagement', contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<EngagementScore>(
        'get_contact_engagement_score',
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
