import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  metadata: Record<string, unknown> | null;
}

export function useContactTimeline(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-timeline', user?.id, contactId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<TimelineEvent[]>(
        'get_contact_timeline',
        { p_contact_id: contactId, p_limit: 50 }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
