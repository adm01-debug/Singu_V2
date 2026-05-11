import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { differenceInDays, isBefore, addDays } from 'date-fns';

export interface UpcomingLifeEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  contact_id: string;
  contact_name: string;
  days_until: number;
  recurring: boolean;
}

export function useUpcomingLifeEvents(daysThreshold: number = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-life-events', user?.id, daysThreshold],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('life_events')
        .select(`
          id, title, event_date, event_type, contact_id, recurring,
          contacts (first_name, last_name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return (data || [])
        .map(event => {
          const contact = event.contacts as any;
          let eventDate = new Date(event.event_date);
          
          if (event.recurring) {
            const thisYearEvent = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            if (isBefore(thisYearEvent, today) && differenceInDays(today, thisYearEvent) > 0) {
              thisYearEvent.setFullYear(today.getFullYear() + 1);
            }
            eventDate = thisYearEvent;
          }

          const daysUntil = differenceInDays(eventDate, today);

          return {
            id: event.id,
            title: event.title,
            event_date: eventDate.toISOString(),
            event_type: event.event_type,
            contact_id: event.contact_id,
            contact_name: `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim(),
            days_until: daysUntil,
            recurring: event.recurring
          };
        })
        .filter(event => event.days_until >= 0 && event.days_until <= daysThreshold)
        .sort((a, b) => a.days_until - b.days_until);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}