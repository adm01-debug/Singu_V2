import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface DealVelocityBenchmark {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  segment: string | null;
  owner_name: string | null;
  avg_days_to_close: number | null;
  current_deal_age: number | null;
  velocity_rating: string | null;
  bottleneck_stage: string | null;
  vs_team_avg: number | null;
  vs_segment_avg: number | null;
  stage_velocity: unknown;
  recommended_actions: string[] | null;
  velocity_status: string | null;
  action_recommendation: string | null;
}

export function useDealVelocityBenchmark(contactId: string | undefined) {
  return useQuery({
    queryKey: ['deal-velocity-benchmark', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<DealVelocityBenchmark>({
        table: 'vw_deal_velocity_benchmark',
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
