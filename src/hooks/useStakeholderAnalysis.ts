import { useMemo } from 'react';
import type { Tables } from '@/integrations/supabase/types';
import type { DecisionRole } from '@/types';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

export interface StakeholderMetrics {
  power: number; // 1-10 - ability to influence decisions
  interest: number; // 1-10 - level of interest in the outcome
  influence: number; // 1-10 - ability to sway others
  support: number; // -5 to +5 - positive = supporter, negative = blocker
  engagement: number; // 1-10 - current engagement level
}

export interface StakeholderData {
  contact: Contact;
  metrics: StakeholderMetrics;
  quadrant: 'manage_closely' | 'keep_satisfied' | 'keep_informed' | 'monitor';
  strategyRecommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
  priority: number;
}

export interface StakeholderMapData {
  stakeholders: StakeholderData[];
  summary: {
    totalStakeholders: number;
    champions: number;
    blockers: number;
    neutrals: number;
    avgPower: number;
    avgInterest: number;
    avgInfluence: number;
    riskScore: number;
  };
  recommendations: string[];
}

// Role-based power mapping
const ROLE_POWER_MAP: Record<string, number> = {
  owner: 10,
  decision_maker: 9,
  manager: 7,
  buyer: 6,
  influencer: 5,
  contact: 3,
};

// Decision role influence mapping
const DECISION_ROLE_INFLUENCE: Record<DecisionRole, number> = {
  final_decision: 10,
  economic: 8,
  technical: 7,
  champion: 6,
  blocker: 5,
  user: 4,
};

function calculatePower(contact: Contact): number {
  const behavior = contact.behavior as {
    decisionRole?: DecisionRole;
    decisionPower?: number;
    budgetAuthority?: string;
  } | null;

  let power = ROLE_POWER_MAP[contact.role || 'contact'] || 3;

  // Add decision power if available
  if (behavior?.decisionPower) {
    power = Math.max(power, behavior.decisionPower);
  }

  // Boost for budget authority
  if (behavior?.budgetAuthority) {
    const budgetValue = behavior.budgetAuthority.toLowerCase();
    if (budgetValue.includes('ilimitado') || budgetValue.includes('total')) {
      power = Math.min(10, power + 2);
    } else if (budgetValue.includes('alto') || budgetValue.includes('grande')) {
      power = Math.min(10, power + 1);
    }
  }

  // Decision role bonus
  if (behavior?.decisionRole) {
    const roleInfluence = DECISION_ROLE_INFLUENCE[behavior.decisionRole];
    power = Math.max(power, Math.round((power + roleInfluence) / 2));
  }

  return Math.min(10, Math.max(1, power));
}

function calculateInterest(contact: Contact, interactions: Interaction[]): number {
  const contactInteractions = interactions.filter(i => i.contact_id === contact.id);
  const recentInteractions = contactInteractions.filter(i => {
    const date = new Date(i.created_at);
    const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });

  // Base interest from relationship score
  let interest = Math.round((contact.relationship_score || 50) / 10);

  // Boost for recent interactions
  interest += Math.min(3, recentInteractions.length);

  // Boost for positive sentiment
  const positiveInteractions = contactInteractions.filter(i => i.sentiment === 'positive').length;
  const totalInteractions = contactInteractions.length;
  if (totalInteractions > 0) {
    const positiveRatio = positiveInteractions / totalInteractions;
    interest += Math.round(positiveRatio * 2);
  }

  // Stage-based interest
  const stageInterest: Record<string, number> = {
    advocate: 10,
    loyal_customer: 8,
    customer: 7,
    negotiation: 9,
    opportunity: 8,
    qualified_lead: 6,
    prospect: 4,
    at_risk: 7,
    lost: 2,
    unknown: 3,
  };

  const stageBonus = stageInterest[contact.relationship_stage || 'unknown'] || 3;
  interest = Math.round((interest + stageBonus) / 2 * 1.5);

  return Math.min(10, Math.max(1, interest));
}

function calculateInfluence(contact: Contact, allContacts: Contact[]): number {
  const behavior = contact.behavior as {
    decisionRole?: DecisionRole;
    influencesIds?: string[];
    supportLevel?: number;
  } | null;

  let influence = 3; // Base influence

  // Decision role influence
  if (behavior?.decisionRole) {
    influence = DECISION_ROLE_INFLUENCE[behavior.decisionRole] || influence;
  }

  // Number of people they influence
  const influenceCount = behavior?.influencesIds?.length || 0;
  influence += Math.min(3, influenceCount);

  // Support level contribution
  if (behavior?.supportLevel) {
    influence = Math.round((influence + behavior.supportLevel) / 2);
  }

  // High relationship contacts have more influence
  if ((contact.relationship_score || 0) >= 80) {
    influence += 1;
  }

  return Math.min(10, Math.max(1, influence));
}

function calculateSupport(contact: Contact): number {
  const behavior = contact.behavior as {
    decisionRole?: DecisionRole;
    supportLevel?: number;
  } | null;

  // Base support from sentiment
  let support = contact.sentiment === 'positive' ? 2 : 
                contact.sentiment === 'negative' ? -2 : 0;

  // Support level if available
  if (behavior?.supportLevel) {
    support = Math.round((behavior.supportLevel - 5.5) * 0.9);
  }

  // Decision role impact
  if (behavior?.decisionRole === 'champion') {
    support = Math.max(support, 4);
  } else if (behavior?.decisionRole === 'blocker') {
    support = Math.min(support, -3);
  }

  // Relationship stage impact
  const stageSupport: Record<string, number> = {
    advocate: 5,
    loyal_customer: 4,
    customer: 2,
    at_risk: -2,
    lost: -4,
  };

  const stageBonus = stageSupport[contact.relationship_stage || ''] || 0;
  support += stageBonus;

  return Math.min(5, Math.max(-5, support));
}

function calculateEngagement(contact: Contact, interactions: Interaction[]): number {
  const contactInteractions = interactions.filter(i => i.contact_id === contact.id);
  
  // Recency factor
  const lastInteraction = contactInteractions[0];
  let recencyScore = 1;
  if (lastInteraction) {
    const daysSince = (Date.now() - new Date(lastInteraction.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) recencyScore = 10;
    else if (daysSince <= 14) recencyScore = 8;
    else if (daysSince <= 30) recencyScore = 6;
    else if (daysSince <= 60) recencyScore = 4;
    else recencyScore = 2;
  }

  // Frequency factor
  const recentCount = contactInteractions.filter(i => {
    const daysSince = (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  }).length;

  const frequencyScore = Math.min(10, recentCount * 2);

  // Combine factors
  const engagement = Math.round((recencyScore + frequencyScore + (contact.relationship_score || 50) / 10) / 3);

  return Math.min(10, Math.max(1, engagement));
}

function determineQuadrant(power: number, interest: number): StakeholderData['quadrant'] {
  // Power-Interest Matrix
  // High Power, High Interest -> Manage Closely
  // High Power, Low Interest -> Keep Satisfied
  // Low Power, High Interest -> Keep Informed
  // Low Power, Low Interest -> Monitor

  const powerThreshold = 5.5;
  const interestThreshold = 5.5;

  if (power >= powerThreshold && interest >= interestThreshold) {
    return 'manage_closely';
  } else if (power >= powerThreshold && interest < interestThreshold) {
    return 'keep_satisfied';
  } else if (power < powerThreshold && interest >= interestThreshold) {
    return 'keep_informed';
  } else {
    return 'monitor';
  }
}

function getStrategyRecommendation(
  quadrant: StakeholderData['quadrant'],
  metrics: StakeholderMetrics,
  contact: Contact
): string {
  const behavior = contact.behavior as { decisionRole?: DecisionRole } | null;
  const name = contact.first_name;

  switch (quadrant) {
    case 'manage_closely':
      if (metrics.support >= 3) {
        return `${name} é um aliado estratégico. Mantenha engajamento frequente e use-o como defensor interno.`;
      } else if (metrics.support <= -2) {
        return `${name} tem alto poder mas baixo suporte. Priorize descobrir suas objeções e converter para neutro.`;
      }
      return `${name} requer atenção máxima. Agende reuniões regulares e mantenha comunicação proativa.`;

    case 'keep_satisfied':
      return `${name} tem poder mas baixo interesse atual. Mantenha satisfeito com updates pontuais e evite sobrecarregar.`;

    case 'keep_informed':
      if (behavior?.decisionRole === 'champion') {
        return `${name} pode ser um champion valioso. Forneça informações e suporte para influenciar decisores.`;
      }
      return `${name} tem interesse alto. Mantenha informado e use como fonte de informações internas.`;

    case 'monitor':
      return `${name} requer monitoramento passivo. Verifique periodicamente se houve mudanças de papel ou influência.`;
  }
}

function calculateRiskLevel(metrics: StakeholderMetrics, quadrant: StakeholderData['quadrant']): StakeholderData['riskLevel'] {
  // High power blockers are high risk
  if (metrics.power >= 7 && metrics.support <= -2) {
    return 'high';
  }

  // Manage closely stakeholders with low support are medium-high risk
  if (quadrant === 'manage_closely' && metrics.support <= 0) {
    return 'medium';
  }

  // Low engagement from important stakeholders
  if (metrics.power >= 6 && metrics.engagement <= 3) {
    return 'medium';
  }

  return 'low';
}

function calculatePriority(metrics: StakeholderMetrics, quadrant: StakeholderData['quadrant'], riskLevel: StakeholderData['riskLevel']): number {
  let priority = 0;

  // Quadrant weight
  const quadrantWeight: Record<typeof quadrant, number> = {
    manage_closely: 40,
    keep_satisfied: 30,
    keep_informed: 20,
    monitor: 10,
  };
  priority += quadrantWeight[quadrant];

  // Risk weight
  const riskWeight: Record<typeof riskLevel, number> = {
    high: 30,
    medium: 15,
    low: 0,
  };
  priority += riskWeight[riskLevel];

  // Power and influence weight
  priority += (metrics.power + metrics.influence) * 1.5;

  // Support negative weight (blockers get higher priority to address)
  if (metrics.support < 0) {
    priority += Math.abs(metrics.support) * 5;
  }

  return Math.round(priority);
}

function generateRecommendations(stakeholders: StakeholderData[]): string[] {
  const recommendations: string[] = [];

  // Check for high-risk blockers
  const highRiskBlockers = stakeholders.filter(s => s.riskLevel === 'high' && s.metrics.support < 0);
  if (highRiskBlockers.length > 0) {
    const names = highRiskBlockers.map(s => s.contact.first_name).join(', ');
    recommendations.push(`⚠️ Prioridade crítica: ${names} são bloqueadores de alto risco. Desenvolva plano de conversão.`);
  }

  // Check for champions
  const champions = stakeholders.filter(s => s.metrics.support >= 4 && s.metrics.influence >= 6);
  if (champions.length > 0) {
    const names = champions.map(s => s.contact.first_name).join(', ');
    recommendations.push(`🌟 Alavanque seus champions: ${names}. Use-os para influenciar outros stakeholders.`);
  }

  // Low engagement in key stakeholders
  const lowEngagement = stakeholders.filter(s => 
    s.quadrant === 'manage_closely' && s.metrics.engagement <= 4
  );
  if (lowEngagement.length > 0) {
    recommendations.push(`📉 Aumente engajamento com stakeholders-chave que estão inativos. Agende reuniões de check-in.`);
  }

  // Missing high-power contacts
  const hasDecisionMaker = stakeholders.some(s => s.metrics.power >= 9);
  if (!hasDecisionMaker && stakeholders.length > 0) {
    recommendations.push(`🔍 Considere identificar e mapear o decisor final da empresa.`);
  }

  // Power balance
  const avgSupport = stakeholders.reduce((sum, s) => sum + s.metrics.support, 0) / stakeholders.length;
  if (avgSupport < 0) {
    recommendations.push(`⚡ Suporte geral é baixo. Foque em construir relacionamentos positivos antes de avançar.`);
  } else if (avgSupport >= 2) {
    recommendations.push(`✅ Boa base de suporte. Momento favorável para avançar negociações.`);
  }

  return recommendations;
}

export function useStakeholderAnalysis(
  contacts: Contact[],
  interactions: Interaction[]
): StakeholderMapData {
  return useMemo(() => {
    if (contacts.length === 0) {
      return {
        stakeholders: [],
        summary: {
          totalStakeholders: 0,
          champions: 0,
          blockers: 0,
          neutrals: 0,
          avgPower: 0,
          avgInterest: 0,
          avgInfluence: 0,
          riskScore: 0,
        },
        recommendations: ['Adicione contatos para gerar análise de stakeholders.'],
      };
    }

    const stakeholders: StakeholderData[] = contacts.map(contact => {
      const power = calculatePower(contact);
      const interest = calculateInterest(contact, interactions);
      const influence = calculateInfluence(contact, contacts);
      const support = calculateSupport(contact);
      const engagement = calculateEngagement(contact, interactions);

      const metrics: StakeholderMetrics = {
        power,
        interest,
        influence,
        support,
        engagement,
      };

      const quadrant = determineQuadrant(power, interest);
      const strategyRecommendation = getStrategyRecommendation(quadrant, metrics, contact);
      const riskLevel = calculateRiskLevel(metrics, quadrant);
      const priority = calculatePriority(metrics, quadrant, riskLevel);

      return {
        contact,
        metrics,
        quadrant,
        strategyRecommendation,
        riskLevel,
        priority,
      };
    });

    // Sort by priority (descending)
    stakeholders.sort((a, b) => b.priority - a.priority);

    // Calculate summary
    const champions = stakeholders.filter(s => s.metrics.support >= 3).length;
    const blockers = stakeholders.filter(s => s.metrics.support <= -2).length;
    const neutrals = stakeholders.length - champions - blockers;

    const avgPower = stakeholders.reduce((sum, s) => sum + s.metrics.power, 0) / stakeholders.length;
    const avgInterest = stakeholders.reduce((sum, s) => sum + s.metrics.interest, 0) / stakeholders.length;
    const avgInfluence = stakeholders.reduce((sum, s) => sum + s.metrics.influence, 0) / stakeholders.length;

    // Risk score (0-100) - higher is riskier
    const highRiskCount = stakeholders.filter(s => s.riskLevel === 'high').length;
    const mediumRiskCount = stakeholders.filter(s => s.riskLevel === 'medium').length;
    const riskScore = Math.round(
      ((highRiskCount * 100 + mediumRiskCount * 50) / stakeholders.length) * 
      (blockers > champions ? 1.5 : 1)
    );

    const recommendations = generateRecommendations(stakeholders);

    return {
      stakeholders,
      summary: {
        totalStakeholders: stakeholders.length,
        champions,
        blockers,
        neutrals,
        avgPower: Math.round(avgPower * 10) / 10,
        avgInterest: Math.round(avgInterest * 10) / 10,
        avgInfluence: Math.round(avgInfluence * 10) / 10,
        riskScore: Math.min(100, Math.max(0, riskScore)),
      },
      recommendations,
    };
  }, [contacts, interactions]);
}
