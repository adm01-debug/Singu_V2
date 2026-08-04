import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function usePrefetch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const prefetchedIds = useRef(new Set<string>());

  const prefetchContact = useCallback((contactId: string) => {
    if (!user) return;
    const dedupeKey = `contact-${user.id}-${contactId}`;
    if (prefetchedIds.current.has(dedupeKey)) return;
    prefetchedIds.current.add(dedupeKey);

    queryClient.prefetchQuery({
      queryKey: ['contact-detail', user.id, contactId],
      queryFn: async () => {
        const { data } = await supabase
          .from('contacts')
          .select(`
            *,
            company:companies(id, name, industry, logo_url),
            interactions:interactions(id, title, type, created_at, sentiment)
          `)
          .eq('id', contactId)
          .eq('user_id', user.id)
          .maybeSingle();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, user]);

  const prefetchCompany = useCallback((companyId: string) => {
    if (!user) return;
    const dedupeKey = `company-${user.id}-${companyId}`;
    if (prefetchedIds.current.has(dedupeKey)) return;
    prefetchedIds.current.add(dedupeKey);

    queryClient.prefetchQuery({
      queryKey: ['company-detail', user.id, companyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('companies')
          .select(`
            *,
            contacts:contacts(id, first_name, last_name, role, avatar_url)
          `)
          .eq('id', companyId)
          .maybeSingle();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, user]);

  const prefetchInteractions = useCallback((contactId: string) => {
    if (!user) return;
    const dedupeKey = `interactions-${user.id}-${contactId}`;
    if (prefetchedIds.current.has(dedupeKey)) return;
    prefetchedIds.current.add(dedupeKey);

    queryClient.prefetchQuery({
      queryKey: ['interactions', user.id, contactId],
      queryFn: async () => {
        const { data } = await supabase
          .from('interactions')
          .select('id, title, type, created_at, sentiment, follow_up_required, follow_up_date, outcome, contact_id')
          .eq('contact_id', contactId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        return data;
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient, user]);

  const clearPrefetchCache = useCallback(() => {
    prefetchedIds.current.clear();
  }, []);

  return {
    prefetchContact,
    prefetchCompany,
    prefetchInteractions,
    clearPrefetchCache
  };
}

// Hook for prefetching on hover with delay
export function usePrefetchOnHover(
  prefetchFn: () => void,
  delay: number = 150
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(prefetchFn, delay);
  }, [prefetchFn, delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}
