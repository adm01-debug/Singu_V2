import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/lib/logger";

export type AlertType = 
  | 'sentiment_drop' 
  | 'engagement_drop' 
  | 'churn_risk' 
  | 'purchase_overdue' 
  | 'communication_gap'
  | 'relationship_score_drop'
  | 'positive_momentum';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface BehaviorAlert {
  id: string;
  contactId: string;
  contactName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedAt: string;
  previousValue?: number | string;
  currentValue?: number | string;
  changePercent?: number;
  recommendedAction: string;
  dismissed: boolean;
  actionTaken?: boolean;
  actionTakenAt?: string;
}

const ALERT_TYPE_CONFIG: Record<AlertType, { 
  title: string; 
  icon: string; 
  color: string;
  defaultSeverity: AlertSeverity;
}> = {
  sentiment_drop: {
    title: 'Queda de Sentimento',
    icon: '😟',
    color: 'warning',
    defaultSeverity: 'medium'
  },
  engagement_drop: {
    title: 'Queda de Engajamento',
    icon: '📉',
    color: 'warning',
    defaultSeverity: 'medium'
  },
  churn_risk: {
    title: 'Risco de Churn',
    icon: '⚠️',
    color: 'destructive',
    defaultSeverity: 'high'
  },
  purchase_overdue: {
    title: 'Compra Atrasada',
    icon: '🛒',
    color: 'warning',
    defaultSeverity: 'medium'
  },
  communication_gap: {
    title: 'Gap de Comunicação',
    icon: '📵',
    color: 'warning',
    defaultSeverity: 'medium'
  },
  relationship_score_drop: {
    title: 'Queda no Score',
    icon: '📊',
    color: 'destructive',
    defaultSeverity: 'high'
  },
  positive_momentum: {
    title: 'Momentum Positivo',
    icon: '🚀',
    color: 'success',
    defaultSeverity: 'low'
  }
};

export function useBehaviorAlerts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['behavior-alerts', user?.id], [user?.id]);

  const { data: alerts = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: existingAlerts, error } = await supabase
        .from('alerts')
        .select(`
          *,
          contacts:contact_id (
            first_name,
            last_name
          )
        `)
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (existingAlerts || []).map(alert => {
        const contact = alert.contacts;
        const contactName = contact 
          ? `${contact.first_name} ${contact.last_name}` 
          : 'Contato Desconhecido';

        let alertType: AlertType = 'communication_gap';
        if (alert.type.includes('sentiment')) alertType = 'sentiment_drop';
        else if (alert.type.includes('churn')) alertType = 'churn_risk';
        else if (alert.type.includes('engagement')) alertType = 'engagement_drop';
        else if (alert.type.includes('purchase') || alert.type.includes('renewal')) alertType = 'purchase_overdue';
        else if (alert.type.includes('score')) alertType = 'relationship_score_drop';
        else if (alert.type.includes('positive') || alert.type.includes('opportunity')) alertType = 'positive_momentum';

        const config = ALERT_TYPE_CONFIG[alertType];

        return {
          id: alert.id,
          contactId: alert.contact_id || '',
          contactName,
          type: alertType,
          severity: (alert.priority as AlertSeverity) || config.defaultSeverity,
          title: alert.title,
          description: alert.description || '',
          detectedAt: alert.created_at,
          recommendedAction: alert.action_url || 'Entrar em contato para entender a situação',
          dismissed: alert.dismissed || false
        } as BehaviorAlert;
      });
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const fetchAlerts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  const detectNewAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        { data: contacts, error: contactsError },
        { data: recentInteractions, error: interactionsError },
      ] = await Promise.all([
        supabase.from('contacts').select('*').order('updated_at', { ascending: false }),
        supabase.from('interactions').select('*').gte('created_at', thirtyDaysAgo.toISOString()),
      ]);

      if (contactsError) throw contactsError;
      if (interactionsError) throw interactionsError;

      const newAlerts: Omit<BehaviorAlert, 'id'>[] = [];

      for (const contact of contacts || []) {
        const contactInteractions = recentInteractions?.filter(
          i => i.contact_id === contact.id
        ) || [];

        const contactName = `${contact.first_name} ${contact.last_name}`;

        // Check for communication gap (no interaction in 14+ days)
        const lastInteractionDate = contactInteractions.length > 0
          ? new Date(Math.max(...contactInteractions.map(i => new Date(i.created_at).getTime())))
          : null;

        if (lastInteractionDate) {
          const daysSinceContact = Math.floor(
            (new Date().getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceContact >= 14) {
            newAlerts.push({
              contactId: contact.id,
              contactName,
              type: 'communication_gap',
              severity: daysSinceContact >= 30 ? 'high' : 'medium',
              title: `Sem contato há ${daysSinceContact} dias`,
              description: `${contactName} não tem interações registradas há ${daysSinceContact} dias.`,
              detectedAt: new Date().toISOString(),
              previousValue: daysSinceContact,
              recommendedAction: 'Agende um contato para manter o relacionamento',
              dismissed: false
            });
          }
        }

        // Check for sentiment patterns
        const sentimentCounts = {
          positive: contactInteractions.filter(i => i.sentiment === 'positive').length,
          neutral: contactInteractions.filter(i => i.sentiment === 'neutral').length,
          negative: contactInteractions.filter(i => i.sentiment === 'negative').length
        };

        const totalWithSentiment = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
        
        if (totalWithSentiment >= 3) {
          const negativeRatio = sentimentCounts.negative / totalWithSentiment;
          
          if (negativeRatio > 0.5) {
            newAlerts.push({
              contactId: contact.id,
              contactName,
              type: 'sentiment_drop',
              severity: negativeRatio > 0.7 ? 'high' : 'medium',
              title: 'Sentimento predominantemente negativo',
              description: `${Math.round(negativeRatio * 100)}% das interações recentes com ${contactName} foram negativas.`,
              detectedAt: new Date().toISOString(),
              changePercent: Math.round(negativeRatio * 100),
              recommendedAction: 'Investigue a causa da insatisfação e tome ações corretivas',
              dismissed: false
            });
          }
        }

        // Check for positive momentum
        const positiveRatio = totalWithSentiment > 0 
          ? sentimentCounts.positive / totalWithSentiment 
          : 0;

        if (positiveRatio > 0.8 && totalWithSentiment >= 3) {
          newAlerts.push({
            contactId: contact.id,
            contactName,
            type: 'positive_momentum',
            severity: 'low',
            title: 'Cliente em momentum positivo!',
            description: `${contactName} está com ${Math.round(positiveRatio * 100)}% de interações positivas. Excelente momento para expandir!`,
            detectedAt: new Date().toISOString(),
            changePercent: Math.round(positiveRatio * 100),
            recommendedAction: 'Aproveite o momento para apresentar novas ofertas ou solicitar indicações',
            dismissed: false
          });
        }

        // Check relationship score
        const relationshipScore = contact.relationship_score || 0;
        if (relationshipScore < 40 && contact.relationship_stage !== 'prospect') {
          newAlerts.push({
            contactId: contact.id,
            contactName,
            type: 'relationship_score_drop',
            severity: relationshipScore < 20 ? 'critical' : 'high',
            title: 'Score de relacionamento baixo',
            description: `${contactName} está com score ${relationshipScore}/100. Ação imediata necessária.`,
            detectedAt: new Date().toISOString(),
            currentValue: relationshipScore,
            recommendedAction: 'Priorize este cliente e desenvolva um plano de recuperação',
            dismissed: false
          });
        }
      }

      // Store new alerts — batch-check existing then bulk-insert
      if (newAlerts.length > 0) {
        const contactIds = [...new Set(newAlerts.map(a => a.contactId))];
        const types = [...new Set(newAlerts.map(a => a.type))];
        const { data: existing } = await supabase
          .from('alerts')
          .select('contact_id, type')
          .in('contact_id', contactIds)
          .in('type', types)
          .eq('dismissed', false);
        const existingSet = new Set(
          (existing || []).map(e => `${e.contact_id}::${e.type}`)
        );
        const toInsert = newAlerts
          .filter(a => !existingSet.has(`${a.contactId}::${a.type}`))
          .map(a => ({
            user_id: user.id,
            contact_id: a.contactId,
            type: a.type,
            priority: a.severity,
            title: a.title,
            description: a.description,
            action_url: `/contatos/${a.contactId}`,
            dismissed: false,
          }));
        if (toInsert.length > 0) {
          await supabase.from('alerts').insert(toInsert);
        }
      }

      // Refresh alerts list
      await fetchAlerts();

      if (newAlerts.length > 0) {
        toast({
          title: 'Novos alertas detectados',
          description: `${newAlerts.length} mudança(s) comportamental(is) detectada(s)`,
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Error detecting new alerts:', { error: msg });
    }
  }, [user, fetchAlerts, toast]);

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase.from('alerts').update({ dismissed: true }).eq('id', alertId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Alerta dispensado', description: 'O alerta foi removido da sua lista.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Error dismissing alert:', { error: msg });
      toast({ title: 'Erro ao dispensar alerta', description: msg, variant: 'destructive' });
    }
  }, [toast, queryClient, queryKey]);

  const markActionTaken = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase.from('alerts').update({ dismissed: true }).eq('id', alertId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Ação registrada', description: 'A ação foi marcada como concluída.' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Error marking action taken:', { error: msg });
      toast({ title: 'Erro ao registrar ação', description: msg, variant: 'destructive' });
    }
  }, [toast, queryClient, queryKey]);

  // Stats
  const stats = useMemo(() => {
    const byType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);

    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    return {
      total: alerts.length,
      critical: bySeverity.critical || 0,
      high: bySeverity.high || 0,
      medium: bySeverity.medium || 0,
      low: bySeverity.low || 0,
      byType
    };
  }, [alerts]);

  return {
    alerts,
    stats,
    loading,
    fetchAlerts,
    detectNewAlerts,
    dismissAlert,
    markActionTaken,
    ALERT_TYPE_CONFIG
  };
}
