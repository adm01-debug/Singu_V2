import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface EqEvolution {
  contact_id: string;
  contact_name: string;
  email: string | null;
  company_name: string | null;
  current_eq_score: number | null;
  current_eq_level: string | null;
  last_assessment: string | null;
  self_awareness_score: number | null;
  self_management_score: number | null;
  social_awareness_score: number | null;
  relationship_management_score: number | null;
  communication_style: unknown;
  preferred_approach: string | null;
  sa_status: string | null;
  sm_status: string | null;
  soa_status: string | null;
  rm_status: string | null;
  sales_implications: unknown;
  recommended_techniques: string[] | null;
  avoid_techniques: string[] | null;
  confidence_level: number | null;
}

export function useEqEvolution(contactId: string | undefined) {
  return useQuery({
    queryKey: ['eq-evolution', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<EqEvolution>({
        table: 'vw_eq_evolution',
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
