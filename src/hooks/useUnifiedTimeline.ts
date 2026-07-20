import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInteractions } from './useInteractions';
import { useContactTasks } from './useContactTasks';
import { useContactMeetings } from './useContactMeetings';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

export type UnifiedEventType = 'message' | 'call' | 'meeting' | 'note' | 'task' | 'event' | 'score_change' | 'stage_change' | 'alert' | 'neuro_update';

export interface UnifiedTimelineEvent {
  id: string;
  type: UnifiedEventType;
  subType?: string;
  title: string;
  content?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
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
        .order('event_date', { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60_000,
  });

  // Fetch CRM Alerts
   const { data: crmAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['crm-alerts', contactId],
    queryFn: async () => {
      const { data } = await supabase
        .from('crm_alerts')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60_000,
  });

   const { data: neuroHistory } = useQuery({
     queryKey: ['neuro-history-timeline', contactId],
     queryFn: async () => {
       const { data } = await supabase
         .from('neuro_behavioral_history')
         .select('*')
         .eq('contact_id', contactId)
         .order('created_at', { ascending: false })
         .limit(1000);
       return data || [];
     },
     enabled: !!user && !!contactId,
     staleTime: 10 * 60_000,
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

    // Map CRM Alerts
     (crmAlerts || []).forEach((alert) => {
     // Map Neuro Updates
     (neuroHistory || []).forEach((nh) => {
       events.push({
         id: nh.id,
         type: 'neuro_update',
         title: 'Evolução de Neuromarketing',
         content: `Análise neurocomportamental registrada. Empatia: ${nh.empathy_score}/100.`,
         timestamp: nh.created_at,
         metadata: {
           dominance: nh.dominance_data,
           empathy: nh.empathy_score,
         },
       });
     });
 
      events.push({
        id: alert.id,
        type: 'alert',
        subType: alert.type,
        title: alert.type === 'at_risk' ? '⚠️ Risco de Churn Detectado' : '🔔 Lembrete de Follow-up',
        content: `${alert.message}\n\nAção sugerida: ${alert.suggested_action}`,
        timestamp: alert.created_at,
        metadata: {
          severity: alert.severity,
          is_resolved: alert.is_resolved,
        },
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [interactions, tasks, meetings, lifeEvents, crmAlerts, neuroHistory]);

  return {
    events: unifiedEvents,
    loading: interactionsLoading || tasksLoading || meetingsLoading || lifeEventsLoading || alertsLoading,
  };
}

