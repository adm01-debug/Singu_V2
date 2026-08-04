import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

interface OrphanContact {
  id?: string;
  contact_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function useOrphanContacts(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['orphan-contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<OrphanContact[]>(
        'get_orphan_contacts',
        {}
      );
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as OrphanContact[];
    },
    enabled: enabled && !!user,
    staleTime: 15 * 60 * 1000,
  });
}
