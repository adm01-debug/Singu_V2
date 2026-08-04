import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface SearchContact {
  id: string;
  full_name: string;
  nome_tratamento: string | null;
  relationship_stage: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
}

/** Lightweight search view for quick contact lookups */
export function useSearchContactsView(searchTerm: string, limit = 10) {
  return useQuery({
    queryKey: ['search-contacts-view', searchTerm, limit],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const { data, error } = await queryExternalData<SearchContact>({
        table: 'vw_search_contacts',
        search: { term: searchTerm, columns: ['full_name', 'nome_tratamento', 'email', 'phone'] },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
