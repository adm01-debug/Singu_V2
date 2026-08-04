import { useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useCompanies } from '@/hooks/useCompanies';
import { useInteractions } from '@/hooks/useInteractions';
import { useStakeholderAlerts } from '@/hooks/useStakeholderAlerts';
import { differenceInDays } from 'date-fns';

export interface AccountChurnRisk {
  companyId: string;
  companyName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: AccountRiskFactor[];
  stakeholderHealth: StakeholderHealthMetrics;
  engagementTrend: 'improving' | 'stable' | 'declining' | 'critical';
  recentAlerts: number;
  criticalAlerts: number;
  championCount: number;
  blockerCount: number;
  neutralCount: number;
  contacts: ContactRiskSummary[];
  recommendedActions: string[];
  predictedChurnDate?: string;
  confidenceLevel: number;
}

export interface AccountRiskFactor {
  category: 'stakeholder' | 'engagement' | 'sentiment' | 'activity' | 'relationship';
  factor: string;
  impact: number;
  trend: 'improving' | 'stable' | 'worsening';
  description: string;
  icon: string;
}

export interface StakeholderHealthMetrics {
  overallScore: number;
  championPercentage: number;
  blockerPercentage: number;
  engagementAverage: number;
  supportAverage: number;
  riskConcentration: number;
}

export interface ContactRiskSummary {
  contactId: string;
  contactName: string;
  role?: string;
  riskContribution: number;
  stakeholderType: 'champion' | 'supporter' | 'neutral' | 'blocker' | 'unknown';
  recentAlertCount: number;
}

export function useAccountChurnPrediction() {
  const { contacts, loading: contactsLoading } = useContacts();
  const { companies, loading: companiesLoading } = useCompanies();
  const { interactions, loading: interactionsLoading } = useInteractions();
  const { alerts, loading: alertsLoading } = useStakeholderAlerts();

  const accountChurnAnalysis = useMemo(() => {
    if (contactsLoading || companiesLoading || interactionsLoading || alertsLoading) {
      return [];
    }

    return companies.map(company => {
      const companyContacts = contacts.filter(c => c.company_id === company.id);
      const companyInteractions = interactions.filter(i => 
        // eslint-disable-next-line sonarjs/no-nested-functions
        companyContacts.some(c => c.id === i.contact_id)
      );
      const companyAlerts = alerts.filter(a => 
        a.company_id === company.id || 
        // eslint-disable-next-line sonarjs/no-nested-functions
        companyContacts.some(c => c.id === a.contact_id)
      );

      const riskFactors: AccountRiskFactor[] = [];
      let riskScore = 0;

      // ===== STAKEHOLDER ANALYSIS =====
      const behavior = companyContacts.map(c => {
        const b = c.behavior as Record<string, unknown> | null;
        return {
          contactId: c.id,
          contactName: `${c.first_name} ${c.last_name}`,
          role: c.role_title,
          support: typeof b?.support === 'number' ? b.support : 50,
          engagement: typeof b?.engagement === 'number' ? b.engagement : 50,
          influence: typeof b?.influence === 'number' ? b.influence : 50,
        };
      });

      const champions = behavior.filter(b => b.support >= 70);
      const blockers = behavior.filter(b => b.support < 30);
      const neutrals = behavior.filter(b => b.support >= 30 && b.support < 70);
      
      const avgSupport = behavior.length > 0 
        ? behavior.reduce((sum, b) => sum + b.support, 0) / behavior.length 
        : 50;
      const avgEngagement = behavior.length > 0 
        ? behavior.reduce((sum, b) => sum + b.engagement, 0) / behavior.length 
        : 50;

      // Factor: No champions
      if (champions.length === 0 && companyContacts.length > 0) {
        const impact = 25;
        riskScore += impact;
        riskFactors.push({
          category: 'stakeholder',
          factor: 'Sem Champions',
          impact,
          trend: 'worsening',
          description: 'Nenhum stakeholder com alto suporte identificado',
          icon: '⚠️'
        });
      }

      // Factor: Multiple blockers
      if (blockers.length >= 2) {
        const impact = Math.min(30, blockers.length * 15);
        riskScore += impact;
        riskFactors.push({
          category: 'stakeholder',
          factor: 'Múltiplos Bloqueadores',
          impact,
          trend: 'worsening',
          description: `${blockers.length} stakeholders com baixo suporte`,
          icon: '🚫'
        });
      } else if (blockers.length === 1) {
        const impact = 15;
        riskScore += impact;
        riskFactors.push({
          category: 'stakeholder',
          factor: 'Bloqueador Identificado',
          impact,
          trend: 'stable',
          description: `1 stakeholder potencialmente contrário`,
          icon: '⚡'
        });
      }

      // Factor: Low average support
      if (avgSupport < 40) {
        const impact = (40 - avgSupport) / 2;
        riskScore += impact;
        riskFactors.push({
          category: 'stakeholder',
          factor: 'Suporte Médio Baixo',
          impact,
          trend: 'worsening',
          description: `Média de suporte: ${Math.round(avgSupport)}%`,
          icon: '📉'
        });
      }

      // ===== ENGAGEMENT ANALYSIS =====
      const last30Days = companyInteractions.filter(i => 
        differenceInDays(new Date(), new Date(i.created_at)) <= 30
      ).length;
      const previous30Days = companyInteractions.filter(i => {
        const daysAgo = differenceInDays(new Date(), new Date(i.created_at));
        return daysAgo > 30 && daysAgo <= 60;
      }).length;

      let engagementTrend: 'improving' | 'stable' | 'declining' | 'critical' = 'stable';
      
      if (last30Days === 0 && companyContacts.length > 0) {
        engagementTrend = 'critical';
        const impact = 20;
        riskScore += impact;
        riskFactors.push({
          category: 'engagement',
          factor: 'Sem Engajamento Recente',
          impact,
          trend: 'worsening',
          description: 'Nenhuma interação nos últimos 30 dias',
          icon: '🔇'
        });
      } else if (last30Days < previous30Days * 0.5 && previous30Days > 0) {
        engagementTrend = 'declining';
        const impact = Math.min(15, (previous30Days - last30Days) * 3);
        riskScore += impact;
        riskFactors.push({
          category: 'engagement',
          factor: 'Engajamento em Queda',
          impact,
          trend: 'worsening',
          description: `Interações caíram ${Math.round((1 - last30Days/previous30Days) * 100)}%`,
          icon: '📊'
        });
      } else if (last30Days > previous30Days * 1.5) {
        engagementTrend = 'improving';
      }

      // ===== ALERT ANALYSIS =====
      const recentAlerts = companyAlerts.filter(a => 
        differenceInDays(new Date(), new Date(a.created_at)) <= 30
      );
      const criticalAlerts = recentAlerts.filter(a => 
        a.severity === 'critical' || a.severity === 'high'
      );

      if (criticalAlerts.length >= 3) {
        const impact = Math.min(25, criticalAlerts.length * 8);
        riskScore += impact;
        riskFactors.push({
          category: 'stakeholder',
          factor: 'Muitos Alertas Críticos',
          impact,
          trend: 'worsening',
          description: `${criticalAlerts.length} alertas críticos/altos recentes`,
          icon: '🚨'
        });
      } else if (criticalAlerts.length > 0) {
        const impact = criticalAlerts.length * 5;
        riskScore += impact;
        riskFactors.push({
          category: 'stakeholder',
          factor: 'Alertas Ativos',
          impact,
          trend: 'stable',
          description: `${criticalAlerts.length} alertas que precisam de atenção`,
          icon: '⚠️'
        });
      }

      // ===== SENTIMENT ANALYSIS =====
      const recentSentiments = companyInteractions
        .filter(i => differenceInDays(new Date(), new Date(i.created_at)) <= 60)
        .map(i => i.sentiment);
      
      const negativeSentiments = recentSentiments.filter(s => s === 'negative').length;
      if (negativeSentiments >= 3) {
        const impact = Math.min(15, negativeSentiments * 4);
        riskScore += impact;
        riskFactors.push({
          category: 'sentiment',
          factor: 'Sentimento Negativo',
          impact,
          trend: 'worsening',
          description: `${negativeSentiments} interações com tom negativo`,
          icon: '😟'
        });
      }

      // ===== RELATIONSHIP SCORE =====
      const avgRelationshipScore = companyContacts.length > 0
        ? companyContacts.reduce((sum, c) => sum + (c.relationship_score || 50), 0) / companyContacts.length
        : 50;
      
      if (avgRelationshipScore < 40) {
        const impact = (40 - avgRelationshipScore) / 2;
        riskScore += impact;
        riskFactors.push({
          category: 'relationship',
          factor: 'Relacionamento Fraco',
          impact,
          trend: 'worsening',
          description: `Score médio: ${Math.round(avgRelationshipScore)}%`,
          icon: '💔'
        });
      }

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 25) riskLevel = 'medium';
      else riskLevel = 'low';

      // Generate recommended actions
      const recommendedActions: string[] = [];
      if (blockers.length > 0) {
        recommendedActions.push(`Agendar reuniões individuais com ${blockers.length} bloqueador(es) para entender objeções`);
      }
      if (champions.length === 0) {
        recommendedActions.push('Identificar e cultivar potenciais champions na conta');
      }
      if (engagementTrend === 'critical' || engagementTrend === 'declining') {
        recommendedActions.push('Aumentar frequência de touchpoints com stakeholders-chave');
      }
      if (criticalAlerts.length > 0) {
        recommendedActions.push(`Resolver ${criticalAlerts.length} alertas críticos pendentes`);
      }
      if (recommendedActions.length === 0) {
        recommendedActions.push('Manter cadência atual de relacionamento');
      }

      // Calculate stakeholder health metrics
      const stakeholderHealth: StakeholderHealthMetrics = {
        overallScore: 100 - riskScore,
        championPercentage: companyContacts.length > 0 
          ? (champions.length / companyContacts.length) * 100 
          : 0,
        blockerPercentage: companyContacts.length > 0 
          ? (blockers.length / companyContacts.length) * 100 
          : 0,
        engagementAverage: avgEngagement,
        supportAverage: avgSupport,
        riskConcentration: blockers.length > 0 
          ? blockers.reduce((sum, b) => sum + b.influence, 0) / (behavior.reduce((sum, b) => sum + b.influence, 0) || 1) * 100
          : 0
      };

      // Contact risk summaries
      const contactRiskSummaries: ContactRiskSummary[] = companyContacts.map(contact => {
        // eslint-disable-next-line sonarjs/no-nested-functions
        const b = behavior.find(x => x.contactId === contact.id);
        // eslint-disable-next-line sonarjs/no-nested-functions
        const contactAlerts = companyAlerts.filter(a => a.contact_id === contact.id);
        
        let stakeholderType: ContactRiskSummary['stakeholderType'] = 'unknown';
        if (b) {
          if (b.support >= 70) stakeholderType = 'champion';
          else if (b.support >= 55) stakeholderType = 'supporter';
          else if (b.support >= 30) stakeholderType = 'neutral';
          else stakeholderType = 'blocker';
        }

        return {
          contactId: contact.id,
          contactName: `${contact.first_name} ${contact.last_name}`,
          role: contact.role_title || undefined,
          riskContribution: b ? Math.max(0, 50 - b.support) * (b.influence / 100) : 0,
          stakeholderType,
          // eslint-disable-next-line sonarjs/no-nested-functions
          recentAlertCount: contactAlerts.filter(a => 
            differenceInDays(new Date(), new Date(a.created_at)) <= 30
          ).length
        };
      }).sort((a, b) => b.riskContribution - a.riskContribution);

      // Confidence level based on data availability
      const confidenceLevel = Math.min(100, 
        (companyContacts.length > 0 ? 30 : 0) +
        (companyInteractions.length > 5 ? 30 : companyInteractions.length * 6) +
        (behavior.some(b => b.support !== 50) ? 20 : 0) +
        (recentAlerts.length > 0 ? 20 : 10)
      );

      return {
        companyId: company.id,
        companyName: company.name,
        riskScore: Math.min(100, Math.round(riskScore)),
        riskLevel,
        riskFactors: riskFactors.sort((a, b) => b.impact - a.impact),
        stakeholderHealth,
        engagementTrend,
        recentAlerts: recentAlerts.length,
        criticalAlerts: criticalAlerts.length,
        championCount: champions.length,
        blockerCount: blockers.length,
        neutralCount: neutrals.length,
        contacts: contactRiskSummaries,
        recommendedActions,
        confidenceLevel
      } as AccountChurnRisk;
    });
  }, [contacts, companies, interactions, alerts, contactsLoading, companiesLoading, interactionsLoading, alertsLoading]);

  const atRiskAccounts = useMemo(() => 
    accountChurnAnalysis
      .filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical')
      .sort((a, b) => b.riskScore - a.riskScore),
    [accountChurnAnalysis]
  );

  const healthyAccounts = useMemo(() => 
    accountChurnAnalysis.filter(a => a.riskLevel === 'low'),
    [accountChurnAnalysis]
  );

  const criticalCount = useMemo(() => 
    accountChurnAnalysis.filter(a => a.riskLevel === 'critical').length,
    [accountChurnAnalysis]
  );

  const highRiskCount = useMemo(() => 
    accountChurnAnalysis.filter(a => a.riskLevel === 'high').length,
    [accountChurnAnalysis]
  );

  const averageRiskScore = useMemo(() => {
    if (accountChurnAnalysis.length === 0) return 0;
    return Math.round(
      accountChurnAnalysis.reduce((acc, a) => acc + a.riskScore, 0) / accountChurnAnalysis.length
    );
  }, [accountChurnAnalysis]);

  const portfolioHealthScore = useMemo(() => {
    if (accountChurnAnalysis.length === 0) return 100;
    return Math.round(100 - averageRiskScore);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [averageRiskScore]);

  return {
    accountChurnAnalysis,
    atRiskAccounts,
    healthyAccounts,
    criticalCount,
    highRiskCount,
    averageRiskScore,
    portfolioHealthScore,
    loading: contactsLoading || companiesLoading || interactionsLoading || alertsLoading
  };
}
