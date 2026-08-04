import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ClosingMoment {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  recommended_timing: string | null;
  timing_score: number | null;
  emotional_readiness: string | null;
  engagement_level: string | null;
  positive_signals: string[] | null;
  warning_signals: string[] | null;
  risk_of_losing: string | null;
  risk_factors: string[] | null;
  opportunity_window_start: string | null;
  opportunity_window_end: string | null;
  best_days: string[] | null;
  best_time_ranges: string[] | null;
  recommended_approach: string | null;
  key_talking_points: string[] | null;
  avoid_topics: string[] | null;
  timing_status: string | null;
  priority_rank: number | null;
  valid_until: string | null;
  validity_status: string | null;
}

export function useBestClosingMoments(contactId: string | undefined) {
  return useQuery({
    queryKey: ['best-closing-moments', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ClosingMoment>({
        table: 'vw_best_closing_moments',
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
