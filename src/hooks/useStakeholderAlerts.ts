import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { isPushSupported, getSubscriptionStatus } from '@/lib/pushNotifications';
import { logger } from "@/lib/logger";

export interface StakeholderAlert {
  id: string;
  user_id: string;
  contact_id: string | null;
  company_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  previous_value: Json | null;
  current_value: Json | null;
  recommended_action: string | null;
  dismissed: boolean;
  dismissed_at: string | null;
  created_at: string;
  contact?: {
    first_name: string;
    last_name: string;
  };
  company?: {
    name: string;
  };
}

interface StakeholderMetrics {
  power: number;
  interest: number;
  influence: number;
  support: number;
  engagement: number;
  quadrant: string;
  riskLevel: string;
}

interface StoredMetrics {
  contactId: string;
  metrics: StakeholderMetrics;
  timestamp: string;
}

const ALERT_TYPES = {
  BLOCKER_IDENTIFIED: 'blocker_identified',
  CHAMPION_DISENGAGING: 'champion_disengaging',
  SUPPORT_DROPPED: 'support_dropped',
  RISK_INCREASED: 'risk_increased',
  QUADRANT_CHANGED: 'quadrant_changed',
  ENGAGEMENT_DROPPED: 'engagement_dropped',
  NEW_CHAMPION: 'new_champion',
  SUPPORT_IMPROVED: 'support_improved'
} as const;

const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export function useStakeholderAlerts(companyId?: string) {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<StakeholderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [storedMetrics, setStoredMetrics] = useState<StoredMetrics[]>([]);

  // Function to send push notification for critical stakeholder alerts
  const sendPushNotification = useCallback(async (
    title: string,
    body: string,
    contactId: string,
    severity: string
  ) => {
    // Check if push notifications are supported and subscribed
    if (!isPushSupported()) return;
    
    try {
      const { isSubscribed } = await getSubscriptionStatus();
      if (!isSubscribed) return;
      
      // Check if permission is granted
      if (Notification.permission !== 'granted') return;

      // Show notification via service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        const notificationOptions: NotificationOptions & { 
          vibrate?: number[];
          requireInteraction?: boolean;
          data?: Record<string, unknown>;
        } = {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `stakeholder-${contactId}-${Date.now()}`,
          data: {
            type: 'stakeholder_alert',
            contactId,
            severity,
            url: `/contatos/${contactId}`
          }
        };
        
        await registration.showNotification(title, notificationOptions);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sending stakeholder push notification:', { error: msg });
    }
  }, []);

  const fetchAlerts = useCallback(async (signal?: { cancelled: boolean }) => {
    try {
      if (!user) return;

      let query = supabase
        .from('stakeholder_alerts')
        .select(`
          *,
          contact:contacts(first_name, last_name),
          company:companies(name)
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query.limit(500);

      if (signal?.cancelled) return;
      if (error) throw error;

      // Type assertion for the joined data
      const typedData = (data || []).map(alert => ({
        ...alert,
        contact: alert.contact as { first_name: string; last_name: string } | undefined,
        company: alert.company as { name: string } | undefined
      })) as StakeholderAlert[];

      setAlerts(typedData);
    } catch (error) {
      if (!signal?.cancelled) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching stakeholder alerts:', { error: msg });
      }
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [companyId, user]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchAlerts(signal);
    return () => { signal.cancelled = true; };
  }, [fetchAlerts]);

  const stakeholderMetricsKey = `stakeholder_metrics-${user?.id ?? 'anon'}`;

  // Load stored metrics from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(stakeholderMetricsKey);
      if (stored) {
        try {
          setStoredMetrics(JSON.parse(stored));
        } catch {
          setStoredMetrics([]);
        }
      }
    } catch {
      // localStorage blocked in private browsing
    }
  }, [stakeholderMetricsKey]);

  const saveMetrics = useCallback((contactId: string, metrics: StakeholderMetrics) => {
    const newStored = storedMetrics.filter(m => m.contactId !== contactId);
    newStored.push({
      contactId,
      metrics,
      timestamp: new Date().toISOString()
    });
    setStoredMetrics(newStored);
    try { localStorage.setItem(stakeholderMetricsKey, JSON.stringify(newStored)); } catch { /* quota/private */ }
  }, [storedMetrics, stakeholderMetricsKey]);

  const getStoredMetrics = useCallback((contactId: string): StoredMetrics | undefined => {
    return storedMetrics.find(m => m.contactId === contactId);
  }, [storedMetrics]);

  const createAlert = useCallback(async (
    contactId: string,
    companyId: string | null,
    alertType: string,
    severity: string,
    title: string,
    description: string,
    previousValue: Json | null,
    currentValue: Json | null,
    recommendedAction: string
  ) => {
    try {
      if (!user) return;

      const { error } = await supabase
        .from('stakeholder_alerts')
        .insert([{
          user_id: user.id,
          contact_id: contactId,
          company_id: companyId,
          alert_type: alertType,
          severity,
          title,
          description,
          previous_value: previousValue,
          current_value: currentValue,
          recommended_action: recommendedAction
        }]);

      if (error) throw error;

      // Show toast notification for critical and high severity alerts
      if (severity === SEVERITY_LEVELS.CRITICAL || severity === SEVERITY_LEVELS.HIGH) {
        toast.warning(title, {
          description: description,
          duration: 5000
        });
        
        // Send push notification for critical/high severity alerts
        sendPushNotification(title, description, contactId, severity);
      }

      fetchAlerts();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating stakeholder alert:', { error: msg });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [fetchAlerts, user]);

  const checkForChanges = useCallback(async (
    contactId: string,
    contactName: string,
    companyId: string | null,
    currentMetrics: StakeholderMetrics
  ) => {
    const stored = getStoredMetrics(contactId);
    
    if (!stored) {
      // First time seeing this contact, just store metrics
      saveMetrics(contactId, currentMetrics);
      
      // But check for immediate alerts (e.g., blocker identified on first analysis)
      if (currentMetrics.support < 30) {
        await createAlert(
          contactId,
          companyId,
          ALERT_TYPES.BLOCKER_IDENTIFIED,
          SEVERITY_LEVELS.CRITICAL,
          `🚨 Bloqueador Identificado: ${contactName}`,
          `${contactName} foi identificado como um potencial bloqueador com suporte de apenas ${currentMetrics.support}%.`,
          null,
          { support: currentMetrics.support, quadrant: currentMetrics.quadrant },
          'Agende uma reunião individual para entender suas preocupações e tentar converter em neutro ou apoiador.'
        );
      } else if (currentMetrics.support >= 80) {
        await createAlert(
          contactId,
          companyId,
          ALERT_TYPES.NEW_CHAMPION,
          SEVERITY_LEVELS.LOW,
          `🌟 Novo Champion: ${contactName}`,
          `${contactName} foi identificado como um Champion com ${currentMetrics.support}% de suporte.`,
          null,
          { support: currentMetrics.support, quadrant: currentMetrics.quadrant },
          'Mantenha relacionamento próximo e considere utilizar como referência interna.'
        );
      }
      return;
    }

    const previous = stored.metrics;
    const changes: string[] = [];

    // Check for blocker identification
    if (previous.support >= 30 && currentMetrics.support < 30) {
      await createAlert(
        contactId,
        companyId,
        ALERT_TYPES.BLOCKER_IDENTIFIED,
        SEVERITY_LEVELS.CRITICAL,
        `🚨 Novo Bloqueador: ${contactName}`,
        `${contactName} passou de neutro/apoiador para bloqueador. Suporte caiu de ${previous.support}% para ${currentMetrics.support}%.`,
        { support: previous.support, quadrant: previous.quadrant },
        { support: currentMetrics.support, quadrant: currentMetrics.quadrant },
        'Ação urgente necessária! Identifique as objeções e agende reunião para reverter a situação.'
      );
      changes.push('blocker');
    }

    // Check for champion disengaging
    if (previous.support >= 80 && currentMetrics.support < 70) {
      await createAlert(
        contactId,
        companyId,
        ALERT_TYPES.CHAMPION_DISENGAGING,
        SEVERITY_LEVELS.HIGH,
        `⚠️ Champion Desengajando: ${contactName}`,
        `${contactName} está perdendo engajamento. Suporte caiu de ${previous.support}% para ${currentMetrics.support}%.`,
        { support: previous.support, engagement: previous.engagement },
        { support: currentMetrics.support, engagement: currentMetrics.engagement },
        'Reforce o relacionamento imediatamente. Agende uma conversa para entender o que mudou.'
      );
      changes.push('champion_disengaging');
    }

    // Check for significant support drop
    if (!changes.includes('blocker') && !changes.includes('champion_disengaging') && 
        previous.support - currentMetrics.support >= 20) {
      await createAlert(
        contactId,
        companyId,
        ALERT_TYPES.SUPPORT_DROPPED,
        SEVERITY_LEVELS.MEDIUM,
        `📉 Queda de Suporte: ${contactName}`,
        `O nível de suporte de ${contactName} caiu significativamente de ${previous.support}% para ${currentMetrics.support}%.`,
        { support: previous.support },
        { support: currentMetrics.support },
        'Investigue as causas da queda e tome ações para recuperar o relacionamento.'
      );
    }

    // Check for support improvement
    if (currentMetrics.support - previous.support >= 20) {
      await createAlert(
        contactId,
        companyId,
        ALERT_TYPES.SUPPORT_IMPROVED,
        SEVERITY_LEVELS.LOW,
        `📈 Melhoria de Suporte: ${contactName}`,
        `O nível de suporte de ${contactName} melhorou de ${previous.support}% para ${currentMetrics.support}%.`,
        { support: previous.support },
        { support: currentMetrics.support },
        'Continue as ações que estão funcionando e considere promover este stakeholder a influenciador chave.'
      );
    }

    // Check for risk level increase
    const riskOrder = ['low', 'medium', 'high', 'critical'];
    const prevRiskIndex = riskOrder.indexOf(previous.riskLevel);
    const currRiskIndex = riskOrder.indexOf(currentMetrics.riskLevel);
    
    if (currRiskIndex > prevRiskIndex && currRiskIndex >= 2) {
      await createAlert(
        contactId,
        companyId,
        ALERT_TYPES.RISK_INCREASED,
        currRiskIndex === 3 ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.HIGH,
        `⚠️ Risco Aumentou: ${contactName}`,
        `O nível de risco de ${contactName} aumentou de "${previous.riskLevel}" para "${currentMetrics.riskLevel}".`,
        { riskLevel: previous.riskLevel },
        { riskLevel: currentMetrics.riskLevel },
        'Priorize este stakeholder e desenvolva um plano de mitigação de risco.'
      );
    }

    // Check for quadrant change
    if (previous.quadrant !== currentMetrics.quadrant) {
      const quadrantLabels: Record<string, string> = {
        'manage_closely': 'Gerenciar de Perto',
        'keep_satisfied': 'Manter Satisfeito',
        'keep_informed': 'Manter Informado',
        'monitor': 'Monitorar'
      };
      
      const isCriticalChange = 
        (previous.quadrant === 'manage_closely' && currentMetrics.quadrant !== 'keep_satisfied') ||
        (currentMetrics.quadrant === 'manage_closely' && previous.quadrant !== 'keep_satisfied');
      
      await createAlert(
        contactId,
        companyId,
        ALERT_TYPES.QUADRANT_CHANGED,
        isCriticalChange ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM,
        `🔄 Mudança de Quadrante: ${contactName}`,
        `${contactName} mudou de "${quadrantLabels[previous.quadrant]}" para "${quadrantLabels[currentMetrics.quadrant]}".`,
        { quadrant: previous.quadrant, power: previous.power, interest: previous.interest },
        { quadrant: currentMetrics.quadrant, power: currentMetrics.power, interest: currentMetrics.interest },
        `Ajuste sua estratégia de engajamento para o novo quadrante "${quadrantLabels[currentMetrics.quadrant]}".`
      );
    }

    // Check for engagement drop
    if (previous.engagement - currentMetrics.engagement >= 25) {
      await createAlert(
        contactId,
        companyId,
        ALERT_TYPES.ENGAGEMENT_DROPPED,
        SEVERITY_LEVELS.MEDIUM,
        `📉 Queda de Engajamento: ${contactName}`,
        `O engajamento de ${contactName} caiu de ${previous.engagement}% para ${currentMetrics.engagement}%.`,
        { engagement: previous.engagement },
        { engagement: currentMetrics.engagement },
        'Agende um contato para reativar o relacionamento e entender possíveis barreiras.'
      );
    }

    // Save current metrics for future comparison
    saveMetrics(contactId, currentMetrics);
  }, [getStoredMetrics, saveMetrics, createAlert]);

  const dismissAlert = useCallback(async (alertId: string) => {
    if (!user) return;
    const previousAlerts = alerts;
    setAlerts(prev => prev.filter(a => a.id !== alertId));

    try {
      const { error } = await supabase
        .from('stakeholder_alerts')
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('id', alertId);

      if (error) throw error;
      toast.success('Alerta dispensado');
    } catch (error) {
      setAlerts(previousAlerts);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error dismissing alert:', { error: msg });
      toast.error('Erro ao dispensar alerta', { description: msg });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [alerts]);

  const dismissAllAlerts = useCallback(async () => {
    const previousAlerts = alerts;
    setAlerts([]);

    try {
      if (!user) {
        setAlerts(previousAlerts);
        return;
      }

      let query = supabase
        .from('stakeholder_alerts')
        .update({ dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('dismissed', false);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { error } = await query;
      if (error) throw error;

      toast.success('Todos os alertas foram dispensados');
    } catch (error) {
      setAlerts(previousAlerts);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error dismissing all alerts:', { error: msg });
      toast.error('Erro ao dispensar alertas', { description: msg });
    }
  }, [companyId, alerts, user]);

  return {
    alerts,
    loading,
    checkForChanges,
    dismissAlert,
    dismissAllAlerts,
    refreshAlerts: fetchAlerts,
    ALERT_TYPES,
    SEVERITY_LEVELS
  };
}
