import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type NotifUrgency = 'critical' | 'high' | 'normal' | 'low';
export type NotifStatus = 'pending' | 'delivered' | 'dismissed' | 'clicked' | 'suppressed' | 'snoozed';

export interface SmartNotification {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  body: string | null;
  urgency: NotifUrgency;
  decided_channel: string;
  bundle_key: string | null;
  bundle_count: number;
  status: NotifStatus;
  scheduled_for: string;
  snoozed_until: string | null;
  action_url: string | null;
  created_at: string;
  payload: Record<string, unknown>;
}

const URGENCY_RANK: Record<NotifUrgency, number> = { low: 1, normal: 2, high: 3, critical: 4 };

interface EnqueueInput {
  event_type: string;
  title: string;
  body?: string;
  entity_type?: string;
  entity_id?: string;
  urgency?: NotifUrgency;
  bundle_key?: string;
  action_url?: string;
  payload?: Record<string, unknown>;
}

export function useSmartNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  // tick every minute to release snoozed/scheduled
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const query = useQuery({
    queryKey: ['smart-notifications', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SmartNotification[]> => {
      const { data, error } = await supabase
        .from('smart_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['pending', 'delivered', 'snoozed'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as SmartNotification[];
    },
  });

  // Realtime
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`smart-notif:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'smart_notifications', filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ['smart-notifications', user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, qc]);

  const visible = useMemo(() => {
    return (query.data ?? []).filter((n) => {
      if (n.status === 'snoozed') {
        if (!n.snoozed_until) return false;
        return new Date(n.snoozed_until).getTime() <= now;
      }
      return new Date(n.scheduled_for).getTime() <= now;
    });
  }, [query.data, now]);

  const unreadCount = visible.filter((n) => n.status === 'pending').length;

  const sortedByUrgency = useMemo(() => {
    return [...visible].sort((a, b) => {
      const u = URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency];
      if (u !== 0) return u;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [visible]);

  const update = useMutation({
    mutationFn: async (patch: { id: string; status?: NotifStatus; snoozed_until?: string | null }) => {
      const updates: Record<string, unknown> = {};
      if (patch.status) {
        updates.status = patch.status;
        if (patch.status === 'delivered') updates.delivered_at = new Date().toISOString();
        if (patch.status === 'dismissed') updates.dismissed_at = new Date().toISOString();
        if (patch.status === 'clicked') updates.clicked_at = new Date().toISOString();
      }
      if (patch.snoozed_until !== undefined) updates.snoozed_until = patch.snoozed_until;
      const { error } = await supabase.from('smart_notifications').update(updates).eq('user_id', user!.id).eq('id', patch.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-notifications', user?.id] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha ao atualizar notificação'),
  });

  const markRead = useCallback((id: string) => update.mutate({ id, status: 'delivered' }), [update]);
  const dismiss = useCallback((id: string) => update.mutate({ id, status: 'dismissed' }), [update]);
  const click = useCallback((id: string) => update.mutate({ id, status: 'clicked' }), [update]);
  const snooze = useCallback((id: string, hours: number) => {
    const until = new Date(Date.now() + hours * 3600_000).toISOString();
    update.mutate({ id, status: 'snoozed', snoozed_until: until });
  }, [update]);
  const markAllRead = useCallback(async () => {
    const ids = visible.filter((n) => n.status === 'pending').map((n) => n.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('smart_notifications')
      .update({ status: 'delivered', delivered_at: new Date().toISOString() })
      .eq('user_id', user!.id)
      .in('id', ids);
    if (error) toast.error('Falha ao marcar como lidas');
    else qc.invalidateQueries({ queryKey: ['smart-notifications', user?.id] });
  }, [visible, qc, user?.id]);

  const enqueue = useMutation({
    mutationFn: async (input: EnqueueInput) => {
      const { data, error } = await supabase.functions.invoke('smart-notify', { body: input });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['smart-notifications', user?.id] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha ao enfileirar notificação'),
  });

  return {
    items: sortedByUrgency,
    unreadCount,
    isLoading: query.isLoading,
    markRead,
    dismiss,
    click,
    snooze,
    markAllRead,
    enqueue,
  };
}
