import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInteractions } from './useInteractions';
import { useContactTasks } from './useContactTasks';
import { useContactMeetings } from './useContactMeetings';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

export type UnifiedEventType = 'message' | 'call' | 'meeting' | 'note' | 'task' | 'event';

export interface UnifiedTimelineEvent {
  id: string;
  type: UnifiedEventType;
  subType?: string;
  title: string;
  content?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export function useUnifiedTimeline(contactId: string) {
  const { user } = useAuth();
  const { interactions, loading: interactionsLoading } = useInteractions(contactId);
  const { data: tasks, isLoading: tasksLoading } = useContactTasks(contactId);
  const { data: meetings, isLoading: meetingsLoading } = useContactMeetings(contactId);

  // Fetch life events
  const { data: lifeEvents, isLoading: lifeEventsLoading } = useQuery({
    queryKey: ['life-events', contactId],
    queryFn: async () => {
      const { data } = await supabase
        .from('life_events')
        .select('*')
        .eq('contact_id', contactId)
        .order('event_date', { ascending: false });
      return data || [];
    },
    enabled: !!user && !!contactId,
  });

  const unifiedEvents = useMemo(() => {
    const events: UnifiedTimelineEvent[] = [];

    // Map Interactions
    interactions.forEach((it) => {
      let type: UnifiedEventType = 'note';
      if (it.type === 'call') type = 'call';
      else if (it.type === 'whatsapp' || it.type === 'email') type = 'message';
      else if (it.type === 'meeting') type = 'meeting';

      events.push({
        id: it.id,
        type,
        subType: it.type,
        title: it.title || 'Sem título',
        content: it.content || it.transcription || undefined,
        timestamp: it.created_at,
        metadata: {
          sentiment: it.sentiment,
          duration: it.duration,
          initiated_by: it.initiated_by,
        },
      });
    });

    // Map Tasks
    (tasks || []).forEach((t) => {
      events.push({
        id: t.id,
        type: 'task',
        title: t.title,
        content: t.description,
        timestamp: t.created_at,
        metadata: {
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
        },
      });
    });

    // Map Meetings
    (meetings || []).forEach((m) => {
      events.push({
        id: m.id,
        type: 'meeting',
        title: m.title,
        content: m.description || m.notes,
        timestamp: m.scheduled_at || m.created_at,
        metadata: {
          status: m.status,
          type: m.meeting_type,
          duration: m.duration_minutes,
        },
      });
    });

    // Map Life Events
    (lifeEvents || []).forEach((le) => {
      events.push({
        id: le.id,
        type: 'event',
        subType: le.event_type,
        title: le.title,
        content: le.description || undefined,
        timestamp: le.event_date,
        metadata: {
          recurring: le.recurring,
        },
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [interactions, tasks, meetings, lifeEvents]);

  return {
    events: unifiedEvents,
    loading: interactionsLoading || tasksLoading || meetingsLoading || lifeEventsLoading,
  };
}
