import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SequenceEvent {
  id: string;
  enrollment_id: string;
  sequence_id: string;
  contact_id: string;
  step_order: number | null;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed' | 'visited_page' | 'meeting_booked' | 'failed';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SequenceSendLog {
  id: string;
  enrollment_id: string;
  step_order: number;
  channel: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  sent_at: string;
  error_message: string | null;
}

export function useSequenceEvents(sequenceId?: string, enrollmentId?: string) {
  return useQuery({
    queryKey: ['sequence-events', sequenceId, enrollmentId],
    queryFn: async () => {
      let q = supabase.from('sequence_events').select('*').order('created_at', { ascending: false }).limit(200);
      if (enrollmentId) q = q.eq('enrollment_id', enrollmentId);
      else if (sequenceId) q = q.eq('sequence_id', sequenceId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as SequenceEvent[];
    },
    enabled: !!(sequenceId || enrollmentId),
    staleTime: 60_000,
  });
}

export function useSequenceSendLogs(sequenceId?: string) {
  return useQuery({
    queryKey: ['sequence-send-logs', sequenceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sequence_send_log')
        .select('*')
        .eq('sequence_id', sequenceId!)
        .order('sent_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as SequenceSendLog[];
    },
    enabled: !!sequenceId,
    staleTime: 60_000,
  });
}

export function useSequenceMetrics(sequenceId?: string) {
  return useQuery({
    queryKey: ['sequence-metrics', sequenceId],
    queryFn: async () => {
      if (!sequenceId) return null;
      const { data: events } = await supabase
        .from('sequence_events')
        .select('event_type')
        .eq('sequence_id', sequenceId)
        .limit(1000);
      const list = (events || []) as Array<{ event_type: string }>;
      const sent = list.filter(e => e.event_type === 'sent').length;
      const opened = list.filter(e => e.event_type === 'opened').length;
      const clicked = list.filter(e => e.event_type === 'clicked').length;
      const replied = list.filter(e => e.event_type === 'replied').length;
      return {
        sent, opened, clicked, replied,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        replyRate: sent > 0 ? (replied / sent) * 100 : 0,
      };
    },
    enabled: !!sequenceId,
    staleTime: 60_000,
  });
}
