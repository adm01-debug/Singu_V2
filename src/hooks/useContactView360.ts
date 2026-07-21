import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

/**
 * Pre-computed 360° view from the external DB (vw_singu_contact_360).
 * Replaces 5+ parallel queries with a single row per contact.
 */
export interface ContactView360 {
  contact_id: string;
  user_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  cargo: string | null;
  departamento: string | null;
  relationship_score: number | null;
  relationship_stage: string | null;
  sentiment: string | null;
  company_id: string | null;
  company_name: string | null;
  company_cnpj: string | null;
  disc_primary: string | null;
  disc_secondary: string | null;
  disc_blend: string | null;
  disc_confidence: number | null;
  disc_analyzed_at: string | null;
  eq_score: number | null;
  eq_level: string | null;
  cadence_days: number | null;
  next_contact_due: string | null;
  last_contact_at: string | null;
  interaction_count: number | null;
  active_insights: number | null;
  open_objections: number | null;
  pending_health_alerts: number | null;
}

export function useContactView360(contactId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-view-360', user?.id, contactId],
    queryFn: async () => {
      if (!contactId) return null;

      const { data, error } = await queryExternalData<ContactView360>({
        table: 'vw_singu_contact_360',
        filters: [
          { type: 'eq', column: 'contact_id', value: contactId },
          { type: 'eq', column: 'user_id', value: user!.id },
        ],
        range: { from: 0, to: 0 },
      });

      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
