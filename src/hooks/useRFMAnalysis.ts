import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { differenceInDays } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';
import {
  RFMAnalysis, RFMHistory, RFMSegment, RFMScore, RFMDashboardStats,
  RFMContactSummary, RFMAction, RFMOffer, RFMTrend, CommunicationPriority,
  RFM_SEGMENTS, determineRFMSegment, calculateRFMScore
} from '@/types/rfm';
import { logger } from "@/lib/logger";
import { callExternalRpc } from '@/lib/externalData';

interface PurchaseData {
  contactId: string;
  totalPurchases: number;
  totalValue: number;
  lastPurchaseDate: Date | null;
  averageOrderValue: number;
}

export function useRFMAnalysis(contactId?: string) {
  const { user } = useAuth();
  const { contacts } = useContacts(undefined, { fetchAll: true });
  const { interactions } = useInteractions();
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);

  const { data: rfmData = [], isLoading: rfmLoading } = useQuery({
    queryKey: ['rfm-analysis', user?.id, contactId],
    queryFn: async () => {
      let query = supabase.from('rfm_analysis').select('id, user_id, contact_id, recency_score, frequency_score, monetary_score, rfm_score, total_score, days_since_last_purchase, days_since_last_interaction, total_purchases, total_interactions, total_monetary_value, average_order_value, segment, segment_description, segment_color, recency_trend, frequency_trend, monetary_trend, overall_trend, predicted_next_purchase_date, predicted_lifetime_value, churn_probability, recommended_actions, recommended_offers, communication_priority, analyzed_at, created_at, updated_at').eq('user_id', user!.id);
      if (contactId) query = query.eq('contact_id', contactId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id, userId: item.user_id, contactId: item.contact_id,
        recencyScore: item.recency_score as RFMScore, frequencyScore: item.frequency_score as RFMScore,
        monetaryScore: item.monetary_score as RFMScore, rfmScore: item.rfm_score, totalScore: item.total_score,
        daysSinceLastPurchase: item.days_since_last_purchase, daysSinceLastInteraction: item.days_since_last_interaction,
        totalPurchases: item.total_purchases || 0, totalInteractions: item.total_interactions || 0,
        totalMonetaryValue: Number(item.total_monetary_value) || 0, averageOrderValue: Number(item.average_order_value) || 0,
        segment: item.segment as RFMSegment, segmentDescription: item.segment_description || '', segmentColor: item.segment_color || '',
        recencyTrend: item.recency_trend as RFMTrend | null, frequencyTrend: item.frequency_trend as RFMTrend | null,
        monetaryTrend: item.monetary_trend as RFMTrend | null, overallTrend: item.overall_trend as RFMTrend | null,
        predictedNextPurchaseDate: item.predicted_next_purchase_date ? new Date(item.predicted_next_purchase_date) : null,
        predictedLifetimeValue: item.predicted_lifetime_value ? Number(item.predicted_lifetime_value) : null,
        churnProbability: item.churn_probability ? Number(item.churn_probability) : null,
        recommendedActions: (item.recommended_actions as unknown as RFMAction[]) || [],
        recommendedOffers: (item.recommended_offers as unknown as RFMOffer[]) || [],
        communicationPriority: item.communication_priority as CommunicationPriority || 'medium',
        analyzedAt: new Date(item.analyzed_at), createdAt: new Date(item.created_at), updatedAt: new Date(item.updated_at)
      })) as RFMAnalysis[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    gcTime: 10 * 60 * 1000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['rfm-history', user?.id, contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase.from('rfm_history').select('id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value, recorded_at')
        .eq('user_id', user!.id).eq('contact_id', contactId)
        .order('recorded_at', { ascending: false }).limit(12);
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id, contactId: item.contact_id,
        recencyScore: item.recency_score as RFMScore, frequencyScore: item.frequency_score as RFMScore,
        monetaryScore: item.monetary_score as RFMScore, segment: item.segment as RFMSegment,
        totalMonetaryValue: item.total_monetary_value ? Number(item.total_monetary_value) : null,
        recordedAt: new Date(item.recorded_at)
      })) as RFMHistory[];
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const loading = rfmLoading;

  const runAnalysis = useCallback(async () => {
    if (!user?.id || contacts.length === 0) return;
    setAnalyzing(true);
    try {
      const { data: purchaseData, error: purchaseError } = await supabase.from('purchase_history').select('contact_id, amount, purchase_date').eq('user_id', user.id).limit(10000);
      if (purchaseError) throw purchaseError;
      const contactMetrics: Map<string, PurchaseData> = new Map();
      contacts.forEach(contact => {
        const contactInteractions = interactions.filter(i => i.contact_id === contact.id);
        const lastInteraction = contactInteractions.length > 0 ? new Date(Math.max(...contactInteractions.map(i => new Date(i.created_at).getTime()))) : null;
        contactMetrics.set(contact.id, { contactId: contact.id, totalPurchases: 0, totalValue: 0, lastPurchaseDate: lastInteraction, averageOrderValue: 0 });
      });
      (purchaseData || []).forEach(purchase => {
        const existing = contactMetrics.get(purchase.contact_id);
        if (existing) {
          existing.totalPurchases++;
          existing.totalValue += Number(purchase.amount) || 0;
          const purchaseDate = new Date(purchase.purchase_date);
          if (!existing.lastPurchaseDate || purchaseDate > existing.lastPurchaseDate) existing.lastPurchaseDate = purchaseDate;
          existing.averageOrderValue = existing.totalValue / existing.totalPurchases;
        }
      });
      const allMetrics = Array.from(contactMetrics.values());
      const recencyValues = allMetrics.map(m => m.lastPurchaseDate ? differenceInDays(new Date(), m.lastPurchaseDate) : 999).sort((a, b) => a - b);
      const frequencyValues = allMetrics.map(m => m.totalPurchases).sort((a, b) => a - b);
      const monetaryValues = allMetrics.map(m => m.totalValue).sort((a, b) => a - b);
      const getPercentiles = (arr: number[]) => { const len = arr.length; return [arr[Math.floor(len * 0.2)] || 0, arr[Math.floor(len * 0.4)] || 0, arr[Math.floor(len * 0.6)] || 0, arr[Math.floor(len * 0.8)] || 0]; };
      const recencyPercentiles = getPercentiles(recencyValues);
      const frequencyPercentiles = getPercentiles(frequencyValues);
      const monetaryPercentiles = getPercentiles(monetaryValues);
      const rfmResults: Array<Database['public']['Tables']['rfm_analysis']['Insert'] & { segment_code: RFMSegment }> = [];
      for (const [cId, metrics] of contactMetrics) {
        const contact = contacts.find(c => c.id === cId);
        if (!contact) continue;
        const daysSinceLastPurchase = metrics.lastPurchaseDate ? differenceInDays(new Date(), metrics.lastPurchaseDate) : 999;
        const contactInts = interactions.filter(i => i.contact_id === cId);
        const lastInt = contactInts.length > 0 ? new Date(Math.max(...contactInts.map(i => new Date(i.created_at).getTime()))) : null;
        const daysSinceLastInteraction = lastInt ? differenceInDays(new Date(), lastInt) : 999;
        const recencyScore = calculateRFMScore(daysSinceLastPurchase, recencyPercentiles, true);
        const frequencyScore = calculateRFMScore(metrics.totalPurchases, frequencyPercentiles);
        const monetaryScore = calculateRFMScore(metrics.totalValue, monetaryPercentiles);
        const segment = determineRFMSegment(recencyScore, frequencyScore, monetaryScore);
        const segmentInfo = RFM_SEGMENTS[segment];
        const recommendedActions = generateRecommendedActions(segment);
        const recommendedOffers = generateRecommendedOffers(segment, metrics);
        const avgPurchaseCycle = metrics.totalPurchases > 1 ? daysSinceLastPurchase / metrics.totalPurchases : 30;
        const predictedNextPurchaseDate = metrics.lastPurchaseDate ? new Date(metrics.lastPurchaseDate.getTime() + avgPurchaseCycle * 24 * 60 * 60 * 1000) : null;
        const predictedLifetimeValue = metrics.averageOrderValue * 12 * (recencyScore + frequencyScore) / 2;
        const churnProbability = calculateChurnProbability(recencyScore, frequencyScore, daysSinceLastPurchase);
        const communicationPriority = determineCommunicationPriority(segment, churnProbability, metrics.totalValue);
        rfmResults.push({
          user_id: user.id, contact_id: cId, recency_score: recencyScore, frequency_score: frequencyScore,
          monetary_score: monetaryScore, days_since_last_purchase: daysSinceLastPurchase < 999 ? daysSinceLastPurchase : null,
          days_since_last_interaction: daysSinceLastInteraction < 999 ? daysSinceLastInteraction : null,
          total_purchases: metrics.totalPurchases, total_interactions: contactInts.length,
          total_monetary_value: metrics.totalValue, average_order_value: metrics.averageOrderValue,
          segment, segment_code: segment, segment_description: segmentInfo.description, segment_color: segmentInfo.color,
          predicted_next_purchase_date: predictedNextPurchaseDate?.toISOString().split('T')[0],
          predicted_lifetime_value: predictedLifetimeValue, churn_probability: churnProbability,
          recommended_actions: recommendedActions.map(action => ({ ...action })),
          recommended_offers: recommendedOffers.map(offer => ({ ...offer })),
          communication_priority: communicationPriority, analyzed_at: new Date().toISOString()
        });
      }
      if (rfmResults.length > 0) {
        const { data: saved, error } = await callExternalRpc<number>('persist_rfm_analysis', { _rows: rfmResults });
        if (error) throw error;
        if (saved !== rfmResults.length) throw new Error('Persistência RFM incompleta');
      }
      await queryClient.invalidateQueries({ queryKey: ['rfm-analysis'] });
      await queryClient.invalidateQueries({ queryKey: ['rfm-history'] });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error running RFM analysis:', { error: msg });
      throw error;
    } finally {
      setAnalyzing(false);
    }
  }, [user?.id, contacts, interactions, queryClient]);

  const dashboardStats = useMemo((): RFMDashboardStats => {
    if (rfmData.length === 0) return {
      totalAnalyzed: 0, averageRfmScore: 0, averageMonetaryValue: 0, totalRevenue: 0,
      segmentDistribution: {} as Record<RFMSegment, number>,
      scoreDistribution: { recency: {}, frequency: {}, monetary: {} },
      trends: { improving: 0, stable: 0, declining: 0 },
      priorityDistribution: {} as Record<CommunicationPriority, number>,
      atRiskRevenue: 0, championsRevenue: 0
    };
    const segmentDistribution: Record<RFMSegment, number> = { champions: 0, loyal_customers: 0, potential_loyalists: 0, recent_customers: 0, promising: 0, needing_attention: 0, about_to_sleep: 0, at_risk: 0, cant_lose: 0, hibernating: 0, lost: 0 };
    const scoreDistribution = { recency: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, frequency: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, monetary: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const trends = { improving: 0, stable: 0, declining: 0 };
    const priorityDistribution: Record<CommunicationPriority, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
    let totalScore = 0, totalMonetary = 0, atRiskRevenue = 0, championsRevenue = 0;
    rfmData.forEach(item => {
      segmentDistribution[item.segment]++;
      scoreDistribution.recency[item.recencyScore]++;
      scoreDistribution.frequency[item.frequencyScore]++;
      scoreDistribution.monetary[item.monetaryScore]++;
      if (item.overallTrend) trends[item.overallTrend]++;
      priorityDistribution[item.communicationPriority]++;
      totalScore += item.totalScore; totalMonetary += item.totalMonetaryValue;
      if (['at_risk', 'cant_lose', 'about_to_sleep'].includes(item.segment)) atRiskRevenue += item.totalMonetaryValue;
      if (item.segment === 'champions') championsRevenue += item.totalMonetaryValue;
    });
    return {
      totalAnalyzed: rfmData.length, averageRfmScore: Math.round(totalScore / rfmData.length * 10) / 10,
      averageMonetaryValue: Math.round(totalMonetary / rfmData.length), totalRevenue: totalMonetary,
      segmentDistribution, scoreDistribution, trends, priorityDistribution, atRiskRevenue, championsRevenue
    };
  }, [rfmData]);

  const contactSummaries = useMemo((): RFMContactSummary[] => {
    return contacts.map(contact => {
      const rfm = rfmData.find(r => r.contactId === contact.id);
      const contactHistory = history.filter(h => h.contactId === contact.id);
      return { contactId: contact.id, contactName: `${contact.first_name} ${contact.last_name}`, companyName: null, avatarUrl: contact.avatar_url, rfmAnalysis: rfm || null, history: contactHistory };
    });
  }, [contacts, rfmData, history]);

  const contactRFM = useMemo(() => {
    if (!contactId) return null;
    return rfmData.find(r => r.contactId === contactId) || null;
  }, [rfmData, contactId]);

  return { rfmData, contactRFM, history, dashboardStats, contactSummaries, loading, analyzing, runAnalysis, refresh: () => queryClient.invalidateQueries({ queryKey: ['rfm-analysis'] }) };
}

// Helper functions
function generateRecommendedActions(segment: RFMSegment): RFMAction[] {
  const segmentActions: Record<RFMSegment, RFMAction[]> = {
    champions: [
      { id: '1', action: 'Oferecer programa VIP', description: 'Convidar para programa de fidelidade exclusivo', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Aumentar retenção em 20%' },
      { id: '2', action: 'Pedir indicações', description: 'Solicitar recomendações para novos clientes', priority: 2, channel: 'whatsapp', timing: 'Após próxima compra', expectedImpact: '2-3 novos leads' },
      { id: '3', action: 'Feedback exclusivo', description: 'Pedir opinião sobre novos produtos', priority: 3, channel: 'meeting', timing: 'Próximo mês', expectedImpact: 'Insights valiosos' }
    ],
    loyal_customers: [
      { id: '1', action: 'Upsell premium', description: 'Apresentar produtos de maior valor', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Aumentar ticket médio 15%' },
      { id: '2', action: 'Cross-sell', description: 'Sugerir produtos complementares', priority: 2, channel: 'whatsapp', timing: 'Próxima interação', expectedImpact: 'Nova categoria de compra' }
    ],
    potential_loyalists: [
      { id: '1', action: 'Nurturing personalizado', description: 'Sequência de emails educativos', priority: 1, channel: 'email', timing: 'Iniciar hoje', expectedImpact: 'Converter para fiel' },
      { id: '2', action: 'Oferta de boas-vindas', description: 'Desconto especial segunda compra', priority: 2, channel: 'any', timing: '7 dias', expectedImpact: 'Acelerar recompra' }
    ],
    recent_customers: [
      { id: '1', action: 'Onboarding completo', description: 'Guia de uso e dicas', priority: 1, channel: 'email', timing: 'Imediato', expectedImpact: 'Satisfação inicial' },
      { id: '2', action: 'Check-in pós-compra', description: 'Verificar satisfação', priority: 2, channel: 'whatsapp', timing: '7 dias', expectedImpact: 'Identificar problemas' }
    ],
    promising: [
      { id: '1', action: 'Educar sobre valor', description: 'Mostrar benefícios dos produtos', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Aumentar percepção de valor' },
      { id: '2', action: 'Oferta trial', description: 'Período de teste de produtos premium', priority: 2, channel: 'any', timing: '14 dias', expectedImpact: 'Upgrade de compra' }
    ],
    needing_attention: [
      { id: '1', action: 'Reengajar com conteúdo', description: 'Enviar conteúdo relevante', priority: 1, channel: 'email', timing: 'Hoje', expectedImpact: 'Reativar interesse' },
      { id: '2', action: 'Oferta limitada', description: 'Desconto com prazo', priority: 2, channel: 'whatsapp', timing: 'Esta semana', expectedImpact: 'Compra imediata' }
    ],
    about_to_sleep: [
      { id: '1', action: 'Ligação de check-in', description: 'Entender motivo do afastamento', priority: 1, channel: 'phone', timing: 'Hoje', expectedImpact: 'Descobrir problemas' },
      { id: '2', action: 'Oferta reativação', description: 'Desconto agressivo', priority: 2, channel: 'email', timing: 'Imediato', expectedImpact: 'Reativar 30%' }
    ],
    at_risk: [
      { id: '1', action: 'Contato urgente', description: 'Ligar para entender situação', priority: 1, channel: 'phone', timing: 'Hoje', expectedImpact: 'Prevenir churn' },
      { id: '2', action: 'Oferta win-back', description: 'Desconto especial + brinde', priority: 2, channel: 'email', timing: 'Imediato', expectedImpact: 'Recuperar 25%' }
    ],
    cant_lose: [
      { id: '1', action: 'Reunião executiva', description: 'Encontro pessoal com decisor', priority: 1, channel: 'meeting', timing: 'Esta semana', expectedImpact: 'Salvar conta estratégica' },
      { id: '2', action: 'Plano exclusivo', description: 'Proposta personalizada', priority: 2, channel: 'email', timing: 'Hoje', expectedImpact: 'Reativar relacionamento' }
    ],
    hibernating: [
      { id: '1', action: 'Email de reengajamento', description: 'Conteúdo personalizado', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Reativar 10-15%' }
    ],
    lost: [
      { id: '1', action: 'Pesquisa de saída', description: 'Entender motivo do afastamento', priority: 1, channel: 'email', timing: 'Próxima semana', expectedImpact: 'Insights para melhoria' }
    ]
  };
  return segmentActions[segment] || [];
}

function generateRecommendedOffers(segment: RFMSegment, metrics: PurchaseData): RFMOffer[] {
  const offers: RFMOffer[] = [];
  if (['champions', 'loyal_customers'].includes(segment)) {
    offers.push({ id: '1', offerType: 'loyalty', description: 'Acesso antecipado + descontos exclusivos', discountPercent: 10, validDays: 30, reason: 'Cliente fiel merece reconhecimento' });
  }
  if (['at_risk', 'about_to_sleep', 'cant_lose'].includes(segment)) {
    offers.push({ id: '2', offerType: 'win_back', description: 'Desconto progressivo baseado no histórico', discountPercent: 20, validDays: 7, reason: 'Reativar cliente em risco' });
  }
  if (['promising', 'potential_loyalists', 'recent_customers'].includes(segment)) {
    offers.push({ id: '3', offerType: 'upsell', description: 'Trial gratuito do plano premium', discountPercent: 50, validDays: 14, reason: 'Acelerar crescimento do cliente' });
  }
  return offers;
}

function calculateChurnProbability(recency: RFMScore, frequency: RFMScore, daysSince: number): number {
  let base = 0;
  if (recency <= 2) base += 30;
  if (frequency <= 2) base += 20;
  if (daysSince > 90) base += 25;
  else if (daysSince > 60) base += 15;
  else if (daysSince > 30) base += 5;
  return Math.min(95, base);
}

function determineCommunicationPriority(segment: RFMSegment, churnProb: number, totalValue: number): CommunicationPriority {
  if (['cant_lose', 'at_risk'].includes(segment) || churnProb > 70) return 'urgent';
  if (['about_to_sleep', 'needing_attention'].includes(segment) || churnProb > 50 || totalValue > 10000) return 'high';
  if (['champions', 'loyal_customers', 'potential_loyalists'].includes(segment)) return 'medium';
  return 'low';
}
