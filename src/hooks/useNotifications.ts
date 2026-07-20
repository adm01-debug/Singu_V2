import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  isPushSupported, 
  subscribeToPush, 
  unsubscribeFromPush, 
  getSubscriptionStatus,
  registerServiceWorker
} from '@/lib/pushNotifications';
import { logger } from "@/lib/logger";

interface NotificationPermission {
  permission: 'default' | 'granted' | 'denied';
  supported: boolean;
}

export const useNotifications = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>({
    permission: 'default',
    supported: false,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if notifications are supported and current subscription status
  useEffect(() => {
    let alive = true;
    const checkStatus = async () => {
      const supported = isPushSupported();
      const permission = supported ? (Notification.permission as NotificationPermission['permission']) : 'denied';
      if (!alive) return;
      setPermissionState({ permission, supported });

      if (supported && permission === 'granted') {
        const { isSubscribed: subscribed } = await getSubscriptionStatus();
        if (alive) setIsSubscribed(subscribed);
      }
    };

    checkStatus();
    return () => { alive = false; };
  }, []);

  // Register service worker on mount
  useEffect(() => {
    if (isPushSupported()) {
      registerServiceWorker();
    }
  }, []);

  // Request notification permission and subscribe
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!permissionState.supported) {
      toast({
        title: 'Notificações não suportadas',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(prev => ({ ...prev, permission: permission as NotificationPermission['permission'] }));
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        const subscription = await subscribeToPush();
        
        if (subscription) {
          setIsSubscribed(true);
          toast({
            title: 'Notificações ativadas!',
            description: 'Você receberá alertas de follow-up, aniversários e insights.',
          });
          return true;
        } else {
          toast({
            title: 'Erro ao ativar',
            description: 'Não foi possível registrar as notificações push.',
            variant: 'destructive',
          });
          return false;
        }
      } else {
        toast({
          title: 'Permissão negada',
          description: 'Você não receberá notificações push.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error requesting notification permission:', { error: msg });
      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [permissionState.supported, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Notificações desativadas',
          description: 'Você não receberá mais notificações push.',
        });
      }
      return success;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error unsubscribing:', { error: msg });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Show a notification (fallback for when app is open)
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions & { data?: Record<string, unknown> }
  ): Promise<boolean> => {
    if (permissionState.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      // Check if service worker is available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          ...options,
        });
      } else {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/pwa-192x192.png',
          ...options,
        });
      }
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error showing notification:', { error: msg });
      return false;
    }
  }, [permissionState.permission, requestPermission]);

  // Check for upcoming follow-ups and show notifications
  const checkFollowUpAlerts = useCallback(async () => {
    if (permissionState.permission !== 'granted') return;

    try {
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch today's follow-ups
      const { data: interactions, error } = await supabase
        .from('interactions')
        .select(`
          id,
          title,
          follow_up_date,
          contact_id
        `)
        .eq('user_id', user.id)
        .eq('follow_up_required', true)
        .gte('follow_up_date', today.toISOString().split('T')[0])
        .lt('follow_up_date', tomorrow.toISOString().split('T')[0]);

      if (error) throw error;

      if (interactions && interactions.length > 0) {
        // Get contact names
        const contactIds = [...new Set(interactions.map(i => i.contact_id))];
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .in('id', contactIds)
          .limit(1000);

        const contactMap = new Map(
          contacts?.map(c => [c.id, `${c.first_name} ${c.last_name}`]) || []
        );

        // Show notification for each follow-up
        for (const interaction of interactions) {
          const contactName = contactMap.get(interaction.contact_id) || 'Contato';
          await showNotification(
            `📅 Follow-up: ${interaction.title}`,
            {
              body: `Lembrete de acompanhamento com ${contactName}`,
              tag: `followup-${interaction.id}`,
              data: {
                type: 'followup',
                interactionId: interaction.id,
                contactId: interaction.contact_id,
              },
            }
          );
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error checking follow-up alerts:', { error: msg });
    }
  }, [permissionState.permission, showNotification, user]);

  // Check for contact birthdays
  const checkBirthdayAlerts = useCallback(async () => {
    if (permissionState.permission !== 'granted') return;

    try {
      if (!user) return;

      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');

      // Fetch contacts with birthday today
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, birthday')
        .eq('user_id', user.id)
        .not('birthday', 'is', null)
        .limit(1000);

      if (error) throw error;

      const birthdayContacts = contacts?.filter(contact => {
        if (!contact.birthday) return false;
        const birthday = new Date(contact.birthday);
        return (
          String(birthday.getMonth() + 1).padStart(2, '0') === month &&
          String(birthday.getDate()).padStart(2, '0') === day
        );
      }) || [];

      for (const contact of birthdayContacts) {
        await showNotification(
          `🎂 Aniversário: ${contact.first_name} ${contact.last_name}`,
          {
            body: 'Não esqueça de enviar uma mensagem de parabéns!',
            tag: `birthday-${contact.id}`,
            data: {
              type: 'birthday',
              contactId: contact.id,
            },
          }
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error checking birthday alerts:', { error: msg });
    }
  }, [permissionState.permission, showNotification, user]);

  // Check for critical stakeholder alerts
  const checkStakeholderAlerts = useCallback(async () => {
    if (permissionState.permission !== 'granted') return;

    try {
      if (!user) return;

      // Fetch recent critical stakeholder alerts (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: alerts, error } = await supabase
        .from('stakeholder_alerts')
        .select(`
          id,
          title,
          description,
          severity,
          contact_id,
          created_at
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .in('severity', ['critical', 'high'])
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      // Check localStorage for already notified alerts
      const notifiedAlerts: string[] = (() => { try { return JSON.parse(localStorage.getItem('notified_stakeholder_alerts') || '[]'); } catch { return []; } })();

      for (const alert of alerts || []) {
        if (!notifiedAlerts.includes(alert.id)) {
          await showNotification(
            alert.severity === 'critical' ? `🚨 ${alert.title}` : `⚠️ ${alert.title}`,
            {
              body: alert.description || 'Alerta de stakeholder detectado',
              tag: `stakeholder-${alert.id}`,
              data: {
                type: 'stakeholder_alert',
                alertId: alert.id,
                contactId: alert.contact_id,
              },
            }
          );
          
          // Mark as notified
          notifiedAlerts.push(alert.id);
          localStorage.setItem('notified_stakeholder_alerts', JSON.stringify(notifiedAlerts));
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error checking stakeholder alerts:', { error: msg });
    }
  }, [permissionState.permission, showNotification, user]);

  // Schedule periodic checks
  useEffect(() => {
    if (permissionState.permission !== 'granted') return;

    // Check immediately on load
    checkFollowUpAlerts();
    checkBirthdayAlerts();
    checkStakeholderAlerts();

    // Set up interval for periodic checks (every hour)
    const intervalId = setInterval(() => {
      checkFollowUpAlerts();
      checkBirthdayAlerts();
      checkStakeholderAlerts();
    }, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [permissionState.permission, checkFollowUpAlerts, checkBirthdayAlerts, checkStakeholderAlerts]);

  return {
    permissionState,
    isSubscribed,
    isLoading,
    requestPermission,
    unsubscribe,
    showNotification,
    checkFollowUpAlerts,
    checkBirthdayAlerts,
    checkStakeholderAlerts,
  };
};
