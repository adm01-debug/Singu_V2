import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface RapportIntel {
  contact_id?: string;
  user_id?: string;
  full_name?: string;
  birthday?: string;
  family_info?: string;
  hobbies?: string[];
  interests?: string[];
  personal_notes?: string;
  top_values?: string[];
  positive_anchors?: string[];
  upcoming_events?: string[];
   relatives?: Record<string, unknown>[];
  rapport_metadata?: Record<string, unknown>;
}

export function useRapportIntel(contactId?: string) {
  return useQuery({
    queryKey: ['rapport-intel', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<RapportIntel>({
        table: 'vw_singu_rapport_intel',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRapportIntelList() {
  return useQuery({
    queryKey: ['rapport-intel-list'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<RapportIntel>({
        table: 'vw_singu_rapport_intel',
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
