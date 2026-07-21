import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface DuplicateContact {
  id?: string;
  contact_id?: string;
  duplicate_of?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  similarity_score?: number;
  [key: string]: unknown;
}

export function useDuplicateContacts(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['duplicate-contacts', user?.id],
    enabled: enabled && !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<DuplicateContact[]>('get_duplicate_contacts', {});
      if (error) {
        logger.warn('[useDuplicateContacts] RPC error (resilience):', error);
        return [];
      }
      return (Array.isArray(data) ? data : []) as DuplicateContact[];
    },
    staleTime: 30 * 60 * 1000,
  });
}
