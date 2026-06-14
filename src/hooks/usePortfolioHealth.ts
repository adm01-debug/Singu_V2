import { useMemo } from 'react';
import { Contact, Interaction } from '@/types';
import { differenceInDays, subDays } from 'date-fns';

export type HealthStatus = 'healthy' | 'warning' | 'critical';

export interface PortfolioHealthMetrics {
  overallScore: number;
  overallStatus: HealthStatus;
  totalClients: number;
  activeClients: number;
  atRiskClients: number;
  criticalClients: number;
  healthDistribution: {
    healthy: number;
    warning: number;
    critical: number;
  };
  trends: {
    improving: number;
    stable: number;
    declining: number;
  };
  averageMetrics: {
    lastContactDays: number;
    interactionsPerMonth: number;
    relationshipScore: number;
    positiveRate: number;
  };
  topPerformers: ClientHealthSummary[];
  needsAttention: ClientHealthSummary[];
  recentlyDeclined: ClientHealthSummary[];
  churnRisk: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recommendations: string[];
  alerts: PortfolioAlert[];
}

export interface ClientHealthSummary {
  contactId: string;
  contactName: string;
  companyName: string;
  healthScore: number;
  status: HealthStatus;
  lastContactDays: number;
  sentiment: string;
  trend: 'up' | 'down' | 'stable';
  mainIssue?: string;
}

export interface PortfolioAlert {
  type: 'critical_health' | 'no_contact' | 'sentiment_drop' | 'churn_risk';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedCount: number;
  contactIds: string[];
}

/** Filter out contacts whose names look like phone numbers, emails, or test data */
function isValidContactName(contact: Contact): boolean {
  const firstName = (contact.firstName || '').trim();
  const lastName = (contact.lastName || '').trim();
  const name = `${firstName} ${lastName}`.trim();
  if (!name || name.length < 2) return false;
  if (/^\(\d+\)\s*\d+/.test(firstName)) return false;
  if (firstName.includes('@')) return false;
  if (/^test/i.test(name)) return false;
  if (firstName.toLowerCase() === 'whatsapp' && /^\d+$/.test(lastName)) return false;
  if (/^\d{10,}$/.test(lastName)) return false;
  if (/^\d+$/.test(name.replace(/\s/g, ''))) return false;
  return true;
}

export function usePortfolioHealth(contacts: Contact[], interactions: Interaction[]) {
  const metrics = useMemo<PortfolioHealthMetrics>(() => {
    const now = new Date();
    const threeMonthsAgo = subDays(now, 90);

    // Filter out technical/test contacts
    const validContacts = contacts.filter(isValidContactName);
    
    // Calculate health for each client
    const clientHealths: ClientHealthSummary[] = validContacts.map(contact => {
      const contactInteractions = interactions.filter(i => i.contactId === contact.id);
      const contactName = `${contact.firstName} ${contact.lastName}`;
      
      // Days since last contact
      const lastContactDays = contact.lastInteraction 
        ? differenceInDays(now, new Date(contact.lastInteraction))
        : 999;
      
      // Recent interactions
      const recentInteractions = contactInteractions.filter(
        i => new Date(i.createdAt) >= threeMonthsAgo
      );
      const interactionsPerMonth = recentInteractions.length / 3;
      
      // Sentiment analysis
      const sentimentScores = { positive: 100, neutral: 50, negative: 0 };
      const avgSentiment = recentInteractions.length > 0
        ? recentInteractions.reduce((acc, i) => acc + sentimentScores[i.sentiment], 0) / recentInteractions.length
        : 50;
      
      // Calculate health score
      let healthScore = 50;
      
      // Recency factor (30%)
      if (lastContactDays <= 7) healthScore += 30;
      else if (lastContactDays <= 14) healthScore += 22;
      else if (lastContactDays <= 30) healthScore += 15;
      else if (lastContactDays <= 60) healthScore += 5;
      else healthScore -= 10;
      
      // Frequency factor (25%)
      healthScore += Math.min(25, interactionsPerMonth * 6);
      
      // Sentiment factor (25%)
      healthScore += (avgSentiment / 100) * 25 - 12.5;
      
      // Relationship score factor (20%)
      healthScore += (contact.relationshipScore / 100) * 20 - 10;
      
      healthScore = Math.max(0, Math.min(100, healthScore));
      
      // Determine status
      let status: HealthStatus = 'healthy';
      if (healthScore < 40 || contact.relationshipStage === 'at_risk' || contact.sentiment === 'negative') {
        status = 'critical';
      } else if (healthScore < 60 || lastContactDays > 30) {
        status = 'warning';
      }
      
      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (contact.sentiment === 'positive' && interactionsPerMonth >= 3) trend = 'up';
      else if (contact.sentiment === 'negative' || lastContactDays > 45) trend = 'down';
      
      // Main issue
      let mainIssue: string | undefined;
      if (lastContactDays > 30) mainIssue = `${lastContactDays} dias sem contato`;
      else if (contact.sentiment === 'negative') mainIssue = 'Sentimento negativo';
      else if (contact.relationshipStage === 'at_risk') mainIssue = 'Em risco de churn';
      
      return {
        contactId: contact.id,
        contactName,
        companyName: contact.companyName,
        healthScore: Math.round(healthScore),
        status,
        lastContactDays,
        sentiment: contact.sentiment,
        trend,
        mainIssue
      };
    });
    
    // Sort by health score
    const sortedByHealth = [...clientHealths].sort((a, b) => a.healthScore - b.healthScore);
    
    // Overall metrics
    const totalClients = validContacts.length;
    const healthyClients = clientHealths.filter(c => c.status === 'healthy');
    const warningClients = clientHealths.filter(c => c.status === 'warning');
    const criticalClients = clientHealths.filter(c => c.status === 'critical');
    
    const overallScore = totalClients > 0
      ? Math.round(clientHealths.reduce((acc, c) => acc + c.healthScore, 0) / totalClients)
      : 0;
    
    let overallStatus: HealthStatus = 'healthy';
    if (criticalClients.length > totalClients * 0.2 || overallScore < 40) {
      overallStatus = 'critical';
    } else if (warningClients.length + criticalClients.length > totalClients * 0.3 || overallScore < 60) {
      overallStatus = 'warning';
    }
    
    // Trends
    const improving = clientHealths.filter(c => c.trend === 'up').length;
    const declining = clientHealths.filter(c => c.trend === 'down').length;
    const stable = clientHealths.filter(c => c.trend === 'stable').length;
    
    // Churn risk categories
    const churnRisk = {
      low: clientHealths.filter(c => c.healthScore >= 70).length,
      medium: clientHealths.filter(c => c.healthScore >= 50 && c.healthScore < 70).length,
      high: clientHealths.filter(c => c.healthScore >= 30 && c.healthScore < 50).length,
      critical: clientHealths.filter(c => c.healthScore < 30).length
    };
    
    // Average metrics
    const avgLastContact = totalClients > 0
      ? Math.round(clientHealths.reduce((acc, c) => acc + Math.min(c.lastContactDays, 365), 0) / totalClients)
      : 0;
    
    const totalInteractions = interactions.filter(i => new Date(i.createdAt) >= threeMonthsAgo).length;
    const avgInteractionsPerMonth = totalClients > 0 ? (totalInteractions / 3) / totalClients : 0;
    
    const avgRelationshipScore = totalClients > 0
      ? Math.round(validContacts.reduce((acc, c) => acc + c.relationshipScore, 0) / totalClients)
      : 0;
    
    const positiveContacts = validContacts.filter(c => c.sentiment === 'positive').length;
    const positiveRate = totalClients > 0 ? Math.round((positiveContacts / totalClients) * 100) : 0;
    
    // Top performers (top 5 by health)
    const topPerformers = [...clientHealths]
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 5);
    
    // Needs attention (bottom 5 by health, excluding healthy)
    const needsAttention = sortedByHealth
      .filter(c => c.status !== 'healthy')
      .slice(0, 5);
    
    // Recently declined (declining trend)
    const recentlyDeclined = clientHealths
      .filter(c => c.trend === 'down')
      .slice(0, 5);
    
    // Build alerts
    const alerts: PortfolioAlert[] = [];
    
    if (criticalClients.length > 0) {
      alerts.push({
        type: 'critical_health',
        severity: 'high',
        title: 'Clientes em Estado Crítico',
        description: `${criticalClients.length} cliente(s) precisam de atenção imediata`,
        affectedCount: criticalClients.length,
        contactIds: criticalClients.map(c => c.contactId)
      });
    }
    
    const noContactClients = clientHealths.filter(c => c.lastContactDays > 30);
    if (noContactClients.length > 0) {
      alerts.push({
        type: 'no_contact',
        severity: noContactClients.length > 5 ? 'high' : 'medium',
        title: 'Clientes Sem Contato Recente',
        description: `${noContactClients.length} cliente(s) há mais de 30 dias sem interação`,
        affectedCount: noContactClients.length,
        contactIds: noContactClients.map(c => c.contactId)
      });
    }
    
    const negativeClients = clientHealths.filter(c => c.sentiment === 'negative');
    if (negativeClients.length > 0) {
      alerts.push({
        type: 'sentiment_drop',
        severity: 'high',
        title: 'Clientes com Sentimento Negativo',
        description: `${negativeClients.length} cliente(s) demonstram insatisfação`,
        affectedCount: negativeClients.length,
        contactIds: negativeClients.map(c => c.contactId)
      });
    }
    
    if (churnRisk.critical + churnRisk.high > 0) {
      alerts.push({
        type: 'churn_risk',
        severity: churnRisk.critical > 0 ? 'high' : 'medium',
        title: 'Risco de Churn Elevado',
        description: `${churnRisk.critical + churnRisk.high} cliente(s) com alto risco de abandono`,
        affectedCount: churnRisk.critical + churnRisk.high,
        contactIds: clientHealths.filter(c => c.healthScore < 50).map(c => c.contactId)
      });
    }
    
    // Recommendations
    const recommendations: string[] = [];
    
    if (avgLastContact > 14) {
      recommendations.push(`Média de ${avgLastContact} dias desde último contato está alta. Aumente a frequência de interações.`);
    }
    if (criticalClients.length > 0) {
      recommendations.push(`Priorize os ${criticalClients.length} clientes em estado crítico esta semana.`);
    }
    if (declining > improving) {
      recommendations.push(`Mais clientes em declínio (${declining}) do que melhorando (${improving}). Investigue as causas.`);
    }
    if (positiveRate < 50) {
      recommendations.push(`Apenas ${positiveRate}% dos clientes têm sentimento positivo. Foque em melhorar o relacionamento.`);
    }
    if (avgInteractionsPerMonth < 2) {
      recommendations.push(`Média de ${avgInteractionsPerMonth.toFixed(1)} interações/mês é baixa. Considere campanhas de reengajamento.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Portfólio saudável! Continue mantendo o ritmo atual de relacionamento.');
    }
    
    return {
      overallScore,
      overallStatus,
      totalClients,
      activeClients: healthyClients.length + warningClients.length,
      atRiskClients: warningClients.length,
      criticalClients: criticalClients.length,
      healthDistribution: {
        healthy: healthyClients.length,
        warning: warningClients.length,
        critical: criticalClients.length
      },
      trends: {
        improving,
        stable,
        declining
      },
      averageMetrics: {
        lastContactDays: avgLastContact,
        interactionsPerMonth: Math.round(avgInteractionsPerMonth * 10) / 10,
        relationshipScore: avgRelationshipScore,
        positiveRate
      },
      topPerformers,
      needsAttention,
      recentlyDeclined,
      churnRisk,
      recommendations,
      alerts
    };
  }, [contacts, interactions]);
  
  return metrics;
}
