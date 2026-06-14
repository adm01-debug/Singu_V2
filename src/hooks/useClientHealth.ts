import { useMemo } from 'react';
import { Contact, Interaction } from '@/types';
import { differenceInDays, subDays } from 'date-fns';

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface HealthIndicator {
  name: string;
  score: number; // 0-100
  status: HealthStatus;
  description: string;
  trend: 'up' | 'down' | 'stable';
  details: string;
}

export interface ClientHealth {
  overallScore: number; // 0-100
  overallStatus: HealthStatus;
  indicators: HealthIndicator[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendations: string[];
  lastContactDays: number;
  contactFrequency: number; // interactions per month
  sentimentTrend: 'improving' | 'stable' | 'declining';
  engagementLevel: 'high' | 'medium' | 'low';
  churnProbability: number; // 0-100
  nextActionUrgency: 'immediate' | 'soon' | 'normal' | 'low';
}

export function useClientHealth(contact: Contact | null, interactions: Interaction[]) {
  const health = useMemo<ClientHealth | null>(() => {
    if (!contact) return null;

    const now = new Date();
    const contactInteractions = interactions.filter(i => i.contactId === contact.id);
    
    // Calculate days since last contact
    const lastContactDays = contact.lastInteraction 
      ? differenceInDays(now, new Date(contact.lastInteraction))
      : 999;

    // Calculate contact frequency (interactions per month over last 3 months)
    const threeMonthsAgo = subDays(now, 90);
    const recentInteractions = contactInteractions.filter(
      i => new Date(i.createdAt) >= threeMonthsAgo
    );
    const contactFrequency = (recentInteractions.length / 3);

    // Calculate sentiment trend
    const lastFiveInteractions = contactInteractions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (lastFiveInteractions.length >= 3) {
      const recentSentiments = lastFiveInteractions.slice(0, 2);
      const olderSentiments = lastFiveInteractions.slice(2);
      
      const sentimentScore = (s: string) => s === 'positive' ? 1 : s === 'neutral' ? 0 : -1;
      const recentAvg = recentSentiments.reduce((acc, i) => acc + sentimentScore(i.sentiment), 0) / recentSentiments.length;
      const olderAvg = olderSentiments.reduce((acc, i) => acc + sentimentScore(i.sentiment), 0) / olderSentiments.length;
      
      if (recentAvg > olderAvg + 0.3) sentimentTrend = 'improving';
      else if (recentAvg < olderAvg - 0.3) sentimentTrend = 'declining';
    }

    // Build health indicators
    const indicators: HealthIndicator[] = [];

    // 1. Contact Recency
    let recencyScore = 100;
    let recencyStatus: HealthStatus = 'healthy';
    if (lastContactDays > 60) { recencyScore = 20; recencyStatus = 'critical'; }
    else if (lastContactDays > 30) { recencyScore = 50; recencyStatus = 'warning'; }
    else if (lastContactDays > 14) { recencyScore = 75; }
    
    indicators.push({
      name: 'Recência de Contato',
      score: recencyScore,
      status: recencyStatus,
      description: lastContactDays < 999 ? `Último contato há ${lastContactDays} dias` : 'Sem contato registrado',
      trend: lastContactDays < 14 ? 'up' : lastContactDays > 30 ? 'down' : 'stable',
      details: lastContactDays > 30 
        ? 'Cliente sem contato há muito tempo. Risco de perda de relacionamento.'
        : 'Frequência de contato adequada.'
    });

    // 2. Contact Frequency
    const frequencyScore = Math.min(100, contactFrequency * 20);
    const frequencyStatus: HealthStatus = 
      contactFrequency >= 4 ? 'healthy' : contactFrequency >= 2 ? 'warning' : 'critical';
    
    indicators.push({
      name: 'Frequência de Interação',
      score: frequencyScore,
      status: frequencyStatus,
      description: `${contactFrequency.toFixed(1)} interações/mês`,
      trend: contactFrequency >= 4 ? 'up' : contactFrequency < 2 ? 'down' : 'stable',
      details: contactFrequency < 2 
        ? 'Baixa frequência de contato pode indicar desengajamento.'
        : 'Mantendo bom ritmo de interações.'
    });

    // 3. Sentiment Health
    const sentimentMap = { positive: 100, neutral: 60, negative: 20 };
    const sentimentScore = sentimentMap[contact.sentiment] || 60;
    
    indicators.push({
      name: 'Sentimento do Cliente',
      score: sentimentScore,
      status: contact.sentiment === 'positive' ? 'healthy' : contact.sentiment === 'neutral' ? 'warning' : 'critical',
      description: contact.sentiment === 'positive' ? 'Positivo' : contact.sentiment === 'neutral' ? 'Neutro' : 'Negativo',
      trend: sentimentTrend === 'improving' ? 'up' : sentimentTrend === 'declining' ? 'down' : 'stable',
      details: sentimentTrend === 'declining' 
        ? 'O sentimento está piorando. Ação necessária.'
        : sentimentTrend === 'improving' 
          ? 'O relacionamento está melhorando!'
          : 'Sentimento estável.'
    });

    // 4. Relationship Score
    const relationshipScore = contact.relationshipScore || 50;
    
    indicators.push({
      name: 'Score de Relacionamento',
      score: relationshipScore,
      status: relationshipScore >= 70 ? 'healthy' : relationshipScore >= 40 ? 'warning' : 'critical',
      description: `${relationshipScore}% de força`,
      trend: 'stable',
      details: relationshipScore < 40 
        ? 'Relacionamento fraco. Investir em aproximação.'
        : 'Relacionamento saudável.'
    });

    // 5. Engagement Level
    const responseRate = contactInteractions.filter(i => i.initiatedBy === 'them').length / Math.max(1, contactInteractions.length);
    const engagementScore = Math.min(100, responseRate * 200);
    
    indicators.push({
      name: 'Nível de Engajamento',
      score: engagementScore,
      status: engagementScore >= 50 ? 'healthy' : engagementScore >= 25 ? 'warning' : 'critical',
      description: `${Math.round(responseRate * 100)}% de taxa de resposta`,
      trend: engagementScore >= 50 ? 'up' : engagementScore < 25 ? 'down' : 'stable',
      details: engagementScore < 25 
        ? 'Cliente pouco engajado. Considere mudar abordagem.'
        : 'Bom nível de engajamento do cliente.'
    });

    // 6. Stage Health
    const stageHealth: Record<string, number> = {
      advocate: 100, loyal_customer: 90, customer: 80, negotiation: 70,
      opportunity: 60, qualified_lead: 50, prospect: 40, unknown: 30, at_risk: 20, lost: 10
    };
    const stageScore = stageHealth[contact.relationshipStage] || 50;
    
    indicators.push({
      name: 'Estágio do Relacionamento',
      score: stageScore,
      status: stageScore >= 70 ? 'healthy' : stageScore >= 40 ? 'warning' : 'critical',
      description: contact.relationshipStage.replace('_', ' '),
      trend: contact.relationshipStage === 'at_risk' ? 'down' : 'stable',
      details: contact.relationshipStage === 'at_risk' 
        ? 'Cliente em risco! Ação urgente necessária.'
        : 'Estágio de relacionamento adequado.'
    });

    // Calculate overall score
    const overallScore = Math.round(
      indicators.reduce((acc, ind) => acc + ind.score, 0) / indicators.length
    );

    // Determine overall status
    const criticalCount = indicators.filter(i => i.status === 'critical').length;
    const warningCount = indicators.filter(i => i.status === 'warning').length;
    let overallStatus: HealthStatus = 'healthy';
    if (criticalCount >= 2 || overallScore < 40) overallStatus = 'critical';
    else if (criticalCount >= 1 || warningCount >= 2 || overallScore < 60) overallStatus = 'warning';

    // Risk assessment
    const riskFactors: string[] = [];
    if (lastContactDays > 30) riskFactors.push('Muito tempo sem contato');
    if (contact.sentiment === 'negative') riskFactors.push('Sentimento negativo');
    if (sentimentTrend === 'declining') riskFactors.push('Tendência de sentimento em queda');
    if (contactFrequency < 2) riskFactors.push('Baixa frequência de interação');
    if (contact.relationshipStage === 'at_risk') riskFactors.push('Marcado como em risco');
    if (engagementScore < 25) riskFactors.push('Baixo engajamento do cliente');

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskFactors.length >= 4) riskLevel = 'critical';
    else if (riskFactors.length >= 3) riskLevel = 'high';
    else if (riskFactors.length >= 1) riskLevel = 'medium';

    // Churn probability
    let churnProbability = 0;
    if (lastContactDays > 60) churnProbability += 30;
    else if (lastContactDays > 30) churnProbability += 15;
    if (contact.sentiment === 'negative') churnProbability += 25;
    if (sentimentTrend === 'declining') churnProbability += 15;
    if (contactFrequency < 1) churnProbability += 20;
    if (contact.relationshipStage === 'at_risk') churnProbability += 25;
    churnProbability = Math.min(95, churnProbability);

    // Engagement level
    let engagementLevel: 'high' | 'medium' | 'low' = 'medium';
    if (engagementScore >= 60 && contactFrequency >= 4) engagementLevel = 'high';
    else if (engagementScore < 30 || contactFrequency < 1) engagementLevel = 'low';

    // Recommendations
    const recommendations: string[] = [];
    if (lastContactDays > 14) recommendations.push(`Agende um contato o mais rápido possível (${lastContactDays} dias sem interação)`);
    if (contact.sentiment === 'negative') recommendations.push('Investigue o motivo da insatisfação e resolva pendências');
    if (sentimentTrend === 'declining') recommendations.push('O sentimento está piorando - considere uma reunião presencial');
    if (contactFrequency < 2) recommendations.push('Aumente a frequência de contatos para manter o relacionamento');
    if (engagementLevel === 'low') recommendations.push('Tente diferentes canais de comunicação para aumentar engajamento');
    if (contact.behavior?.decisionRole === 'champion') recommendations.push('Este é um defensor - mantenha-o engajado e informado');
    if (contact.birthday) {
      const nextBirthday = new Date(contact.birthday);
      nextBirthday.setFullYear(now.getFullYear());
      if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
      const daysUntilBirthday = differenceInDays(nextBirthday, now);
      if (daysUntilBirthday <= 14 && daysUntilBirthday >= 0) {
        recommendations.push(`Aniversário em ${daysUntilBirthday} dias - prepare uma mensagem especial!`);
      }
    }
    if (recommendations.length === 0) recommendations.push('Mantenha o ritmo atual de relacionamento');

    // Next action urgency
    let nextActionUrgency: 'immediate' | 'soon' | 'normal' | 'low' = 'normal';
    if (riskLevel === 'critical' || contact.sentiment === 'negative') nextActionUrgency = 'immediate';
    else if (riskLevel === 'high' || lastContactDays > 21) nextActionUrgency = 'soon';
    else if (overallScore >= 80) nextActionUrgency = 'low';

    return {
      overallScore,
      overallStatus,
      indicators,
      riskLevel,
      riskFactors,
      recommendations,
      lastContactDays,
      contactFrequency,
      sentimentTrend,
      engagementLevel,
      churnProbability,
      nextActionUrgency
    };
  }, [contact, interactions]);

  return health;
}
