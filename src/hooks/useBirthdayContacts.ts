import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";

interface BirthdayContact {
  id?: string;
  contact_id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  contact_name?: string;
  nome?: string;
  birthday?: string;
  data_nascimento?: string;
  days_until?: number;
  company_name?: string;
  empresa?: string;
  [key: string]: unknown;
}

export function useBirthdayContacts(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['birthday-contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<BirthdayContact[]>(
        'get_birthday_contacts',
        { p_days_ahead: 365 }
      );
      if (error) {
        logger.warn('[useBirthdayContacts] RPC error (resilience):', error);
        return [];
      }
      const raw = (Array.isArray(data) ? data : []) as BirthdayContact[];
      // Compute days_until client-side since RPC doesn't return it
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return raw.map((c) => {
        const dateStr = c.data_nascimento || c.birthday;
        if (!dateStr) return { ...c, days_until: undefined };
        const d = new Date(dateStr);
        const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
        if (next < today) next.setFullYear(today.getFullYear() + 1);
        const diff = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...c, days_until: diff };
      }).sort((a, b) => (a.days_until ?? 9999) - (b.days_until ?? 9999));
    },
    enabled: enabled && !!user,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
