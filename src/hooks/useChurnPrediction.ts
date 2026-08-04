import { useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { differenceInDays } from 'date-fns';

export interface ChurnRisk {
  contactId: string;
  contactName: string;
  companyId?: string | null;
  riskScore: number; // 0-100, higher = more at risk
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: ChurnFactor[];
  lastInteraction: Date | null;
  daysSinceContact: number;
  interactionTrend: 'increasing' | 'stable' | 'decreasing' | 'none';
  sentimentTrend: 'positive' | 'neutral' | 'negative' | 'unknown';
  recommendedAction: string;
}

export interface ChurnFactor {
  factor: string;
  impact: number; // 0-100 contribution to risk
  description: string;
}

export function useChurnPrediction() {
  const { contacts, loading: contactsLoading } = useContacts();
  const { interactions, loading: interactionsLoading } = useInteractions();

  const churnAnalysis = useMemo(() => {
    if (contactsLoading || interactionsLoading) return [];

    return contacts.map(contact => {
      const contactInteractions = interactions.filter(i => i.contact_id === contact.id);
      const factors: ChurnFactor[] = [];
      let riskScore = 0;

      // Factor 1: Days since last interaction
      const lastInteraction = contactInteractions.length > 0
        ? new Date(Math.max(...contactInteractions.map(i => new Date(i.created_at).getTime())))
        : null;
      
      const daysSinceContact = lastInteraction 
        ? differenceInDays(new Date(), lastInteraction)
        : 999;

      if (daysSinceContact > 90) {
        const impact = Math.min(40, (daysSinceContact - 90) / 3);
        riskScore += impact;
        factors.push({
          factor: 'Sem contato prolongado',
          impact,
          description: `${daysSinceContact} dias sem interação`
        });
      } else if (daysSinceContact > 30) {
        const impact = (daysSinceContact - 30) / 2;
        riskScore += impact;
        factors.push({
          factor: 'Contato reduzido',
          impact,
          description: `${daysSinceContact} dias desde última interação`
        });
      }

      // Factor 2: Interaction frequency trend
      const last30Days = contactInteractions.filter(i => 
        differenceInDays(new Date(), new Date(i.created_at)) <= 30
      ).length;
      const previous30Days = contactInteractions.filter(i => {
        const daysAgo = differenceInDays(new Date(), new Date(i.created_at));
        return daysAgo > 30 && daysAgo <= 60;
      }).length;

      let interactionTrend: 'increasing' | 'stable' | 'decreasing' | 'none';
      if (last30Days === 0 && previous30Days === 0) {
        interactionTrend = 'none';
        riskScore += 15;
        factors.push({
          factor: 'Sem histórico recente',
          impact: 15,
          description: 'Nenhuma interação nos últimos 60 dias'
        });
      } else if (last30Days < previous30Days * 0.5) {
        interactionTrend = 'decreasing';
        const impact = Math.min(25, (previous30Days - last30Days) * 5);
        riskScore += impact;
        factors.push({
          factor: 'Frequência em queda',
          impact,
          description: `Interações caíram de ${previous30Days} para ${last30Days}`
        });
      } else if (last30Days > previous30Days * 1.5) {
        interactionTrend = 'increasing';
      } else {
        interactionTrend = 'stable';
      }

      // Factor 3: Sentiment analysis
      const recentSentiments = contactInteractions
        .filter(i => differenceInDays(new Date(), new Date(i.created_at)) <= 60)
        .map(i => i.sentiment);
      
      const negativeSentiments = recentSentiments.filter(s => s === 'negative').length;
      const positiveSentiments = recentSentiments.filter(s => s === 'positive').length;
      
      let sentimentTrend: 'positive' | 'neutral' | 'negative' | 'unknown' = 'unknown';
      if (recentSentiments.length > 0) {
        if (negativeSentiments > positiveSentiments) {
          sentimentTrend = 'negative';
          const impact = Math.min(20, negativeSentiments * 5);
          riskScore += impact;
          factors.push({
            factor: 'Sentimento negativo',
            impact,
            description: `${negativeSentiments} interações com sentimento negativo`
          });
        } else if (positiveSentiments > negativeSentiments * 2) {
          sentimentTrend = 'positive';
          riskScore = Math.max(0, riskScore - 10); // Bonus for positive sentiment
        } else {
          sentimentTrend = 'neutral';
        }
      }

      // Factor 4: Relationship score
      const relationshipScore = contact.relationship_score || 50;
      if (relationshipScore < 40) {
        const impact = (40 - relationshipScore) / 2;
        riskScore += impact;
        factors.push({
          factor: 'Score de relacionamento baixo',
          impact,
          description: `Score atual: ${relationshipScore}%`
        });
      }

      // Factor 5: Response time degradation
      const avgResponseTime = contactInteractions
        .filter(i => i.response_time)
        .reduce((acc, i) => acc + (i.response_time || 0), 0) / 
        (contactInteractions.filter(i => i.response_time).length || 1);
      
      if (avgResponseTime > 48) { // More than 48 hours average
        const impact = Math.min(10, (avgResponseTime - 48) / 10);
        riskScore += impact;
        factors.push({
          factor: 'Tempo de resposta lento',
          impact,
          description: `Média de ${Math.round(avgResponseTime)}h para responder`
        });
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 25) riskLevel = 'medium';
      else riskLevel = 'low';

      // Generate recommended action
      let recommendedAction = '';
      if (riskLevel === 'critical') {
        recommendedAction = 'Agendar reunião urgente de recuperação';
      } else if (riskLevel === 'high') {
        recommendedAction = 'Ligar esta semana para check-in';
      } else if (riskLevel === 'medium') {
        recommendedAction = 'Enviar email de acompanhamento';
      } else {
        recommendedAction = 'Manter contato regular';
      }

      return {
        contactId: contact.id,
        contactName: `${contact.first_name} ${contact.last_name}`,
        companyId: contact.company_id,
        riskScore: Math.min(100, Math.round(riskScore)),
        riskLevel,
        factors: factors.sort((a, b) => b.impact - a.impact),
        lastInteraction,
        daysSinceContact,
        interactionTrend,
        sentimentTrend,
        recommendedAction
      } as ChurnRisk;
    });
  }, [contacts, interactions, contactsLoading, interactionsLoading]);

  const atRiskContacts = useMemo(() => 
    churnAnalysis
      .filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical')
      .sort((a, b) => b.riskScore - a.riskScore),
    [churnAnalysis]
  );

  const criticalCount = useMemo(() => 
    churnAnalysis.filter(c => c.riskLevel === 'critical').length,
    [churnAnalysis]
  );

  const highRiskCount = useMemo(() => 
    churnAnalysis.filter(c => c.riskLevel === 'high').length,
    [churnAnalysis]
  );

  const averageRiskScore = useMemo(() => {
    if (churnAnalysis.length === 0) return 0;
    return Math.round(
      churnAnalysis.reduce((acc, c) => acc + c.riskScore, 0) / churnAnalysis.length
    );
  }, [churnAnalysis]);

  return {
    churnAnalysis,
    atRiskContacts,
    criticalCount,
    highRiskCount,
    averageRiskScore,
    loading: contactsLoading || interactionsLoading
  };
}
