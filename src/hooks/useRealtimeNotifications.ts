import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { safehref } from '@/lib/utils';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeNotification {
  id: string;
  type: 'alert' | 'insight' | 'health_alert' | 'interaction' | 'contact';
  title: string;
  description?: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

interface AlertPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string | null;
  created_at: string;
  action_url: string | null;
}

interface InsightPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string;
  created_at: string;
}

interface HealthAlertPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string;
  created_at: string;
  alert_type: string;
}

interface StakeholderAlertPayload {
  id: string;
  title: string;
  description: string | null;
  contact_id: string;
  created_at: string;
  severity: string;
  recommended_action: string | null;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handle new alert
  const handleNewAlert = useCallback((payload: RealtimePostgresChangesPayload<AlertPayload>) => {
    const alert = payload.new as AlertPayload;
    if (!alert || !alert.id) return;
    
    const notification: RealtimeNotification = {
      id: alert.id,
      type: 'alert',
      title: alert.title,
      description: alert.description || undefined,
      entityId: alert.contact_id || undefined,
      entityType: 'contact',
      createdAt: alert.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    toast(alert.title, {
      description: alert.description || undefined,
      action: {
        label: 'Ver',
        onClick: () => {
          if (alert.action_url) {
            const safe = safehref(alert.action_url);
            if (safe !== '#') window.location.href = safe;
          }
        },
      },
    });
  }, []);

  // Handle new insight
  const handleNewInsight = useCallback((payload: RealtimePostgresChangesPayload<InsightPayload>) => {
    const insight = payload.new as InsightPayload;
    if (!insight || !insight.id) return;
    
    const notification: RealtimeNotification = {
      id: insight.id,
      type: 'insight',
      title: insight.title,
      description: insight.description || undefined,
      entityId: insight.contact_id,
      entityType: 'contact',
      createdAt: insight.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    toast.info(`💡 ${insight.title}`, {
      description: insight.description || undefined,
    });
  }, []);

  // Handle new health alert
  const handleNewHealthAlert = useCallback((payload: RealtimePostgresChangesPayload<HealthAlertPayload>) => {
    const alert = payload.new as HealthAlertPayload;
    if (!alert || !alert.id) return;
    
    const notification: RealtimeNotification = {
      id: alert.id,
      type: 'health_alert',
      title: alert.title,
      description: alert.description || undefined,
      entityId: alert.contact_id,
      entityType: 'contact',
      createdAt: alert.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    const icon = alert.alert_type === 'critical' ? '🚨' : '⚠️';
    toast.warning(`${icon} ${alert.title}`, {
      description: alert.description || undefined,
    });
  }, []);

  // Handle new stakeholder alert
  const handleNewStakeholderAlert = useCallback((payload: RealtimePostgresChangesPayload<StakeholderAlertPayload>) => {
    const alert = payload.new as StakeholderAlertPayload;
    if (!alert || !alert.id) return;
    
    const notification: RealtimeNotification = {
      id: alert.id,
      type: 'alert',
      title: alert.title,
      description: alert.description || undefined,
      entityId: alert.contact_id,
      entityType: 'contact',
      createdAt: alert.created_at,
    };

    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);

    const icon = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '⚠️' : 'ℹ️';
    toast(`${icon} ${alert.title}`, {
      description: alert.recommended_action || alert.description || undefined,
    });
  }, []);

  // Defer realtime subscription + initial load to idle time so route transitions stay snappy
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    const schedule = w.requestIdleCallback
      ? (cb: () => void) => w.requestIdleCallback!(cb, { timeout: 3000 })
      : (cb: () => void) => window.setTimeout(cb, 1500);

    const handle = schedule(async () => {
      if (cancelled) return;

      try {
        // Initial load
        const [alertsRes, insightsRes, healthRes] = await Promise.all([
          supabase.from('alerts').select('*').eq('user_id', user.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(20),
          supabase.from('insights').select('*').eq('user_id', user.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(10),
          supabase.from('health_alerts').select('*').eq('user_id', user.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(10),
        ]);
        if (cancelled) return;

        const allNotifications: RealtimeNotification[] = [
          ...(alertsRes.data || []).map(a => ({ id: a.id, type: 'alert' as const, title: a.title, description: a.description || undefined, entityId: a.contact_id || undefined, entityType: 'contact', createdAt: a.created_at })),
          ...(insightsRes.data || []).map(i => ({ id: i.id, type: 'insight' as const, title: i.title, description: i.description || undefined, entityId: i.contact_id, entityType: 'contact', createdAt: i.created_at })),
          ...(healthRes.data || []).map(h => ({ id: h.id, type: 'health_alert' as const, title: h.title, description: h.description || undefined, entityId: h.contact_id, entityType: 'contact', createdAt: h.created_at })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50);

        setNotifications(allNotifications);
        setUnreadCount(allNotifications.length);

        // Subscribe channel
        channel = supabase
          .channel('realtime-notifications')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts', filter: `user_id=eq.${user.id}` }, handleNewAlert)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'insights', filter: `user_id=eq.${user.id}` }, handleNewInsight)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'health_alerts', filter: `user_id=eq.${user.id}` }, handleNewHealthAlert)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stakeholder_alerts', filter: `user_id=eq.${user.id}` }, handleNewStakeholderAlert)
          .subscribe();
      } catch {
        // Network failure during initial load — realtime subscription will still work on reconnect
      }
    });

    return () => {
      cancelled = true;
      if (typeof handle === 'number') window.clearTimeout(handle);
      if (channel) supabase.removeChannel(channel);
    };
  }, [user, handleNewAlert, handleNewInsight, handleNewHealthAlert, handleNewStakeholderAlert]);

  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const dismissNotification = useCallback(async (notification: RealtimeNotification) => {
    const tableMap = {
      alert: 'alerts',
      insight: 'insights',
      health_alert: 'health_alerts',
    } as const;

    const table = tableMap[notification.type as keyof typeof tableMap];
    if (!table) return;

    await supabase
      .from(table)
      .update({ dismissed: true })
      .eq('id', notification.id);

    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  }, []);

  return {
    notifications,
    unreadCount,
    clearUnread,
    dismissNotification,
  };
}
