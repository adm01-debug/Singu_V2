import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

interface BirthdayContact {
  id?: string;
  contact_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  birthday?: string;
  data_nascimento?: string;
  days_until?: number;
  company_name?: string;
  [key: string]: unknown;
}

export function useBirthdayContacts(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['birthday-contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<BirthdayContact[]>(
        'get_birthday_contacts',
        {}
      );
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as BirthdayContact[];
    },
    enabled: enabled && !!user,
    staleTime: 30 * 60 * 1000,
  });
}
