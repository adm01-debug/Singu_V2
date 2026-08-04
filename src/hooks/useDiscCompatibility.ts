import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface DiscCompatibility {
  contact_id: string;
  contact_name: string;
  contact_email: string | null;
  contact_disc: string | null;
  contact_d: number | null;
  contact_i: number | null;
  contact_s: number | null;
  contact_c: number | null;
  user_id: string;
  user_name: string | null;
  user_disc: string | null;
  compatibility_score: number | null;
  communication_tips: string[] | null;
  potential_conflicts: string[] | null;
  recommended_approach: string | null;
  compatibility_level: string | null;
  needs_adaptation_alert: boolean | null;
}

export function useDiscCompatibility(contactId: string | undefined) {
  return useQuery({
    queryKey: ['disc-compatibility', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<DiscCompatibility>({
        table: 'vw_disc_compatibility',
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
