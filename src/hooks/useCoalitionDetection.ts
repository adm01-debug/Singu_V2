import { useMemo } from 'react';
import type { StakeholderData } from './useStakeholderAnalysis';

export interface Coalition {
  id: string;
  name: string;
  type: 'support' | 'opposition' | 'neutral' | 'mixed';
  members: StakeholderData[];
  strength: number; // 0-100
  influence: number; // Combined influence of the coalition
  cohesion: number; // How aligned are the members (0-100)
  leader?: StakeholderData;
  characteristics: string[];
  strategy: string;
  risk: 'low' | 'medium' | 'high';
}

export interface InfluenceCluster {
  id: string;
  center: StakeholderData;
  influenced: StakeholderData[];
  totalReach: number;
  averageInfluenceStrength: number;
}

export interface CoalitionAnalysis {
  coalitions: Coalition[];
  influenceClusters: InfluenceCluster[];
  powerBalance: {
    supportPower: number;
    oppositionPower: number;
    neutralPower: number;
    balance: 'favorable' | 'unfavorable' | 'contested';
    recommendation: string;
  };
  keyConnections: {
    from: StakeholderData;
    to: StakeholderData;
    type: 'influence' | 'alignment' | 'conflict';
    strength: number;
  }[];
  insights: string[];
}

// Calculate similarity between two stakeholders based on their metrics and positions
function calculateSimilarity(a: StakeholderData, b: StakeholderData): number {
  const supportDiff = Math.abs(a.metrics.support - b.metrics.support);
  const quadrantMatch = a.quadrant === b.quadrant ? 20 : 0;
  const riskMatch = a.riskLevel === b.riskLevel ? 10 : 0;
  
  // Similar power and interest suggest similar organizational level
  const powerDiff = Math.abs(a.metrics.power - b.metrics.power);
  const interestDiff = Math.abs(a.metrics.interest - b.metrics.interest);
  
  // Calculate similarity score (0-100)
  let similarity = 100;
  similarity -= supportDiff * 10; // Support difference is most important
  similarity -= powerDiff * 3;
  similarity -= interestDiff * 2;
  similarity += quadrantMatch;
  similarity += riskMatch;
  
  return Math.max(0, Math.min(100, similarity));
}

// Detect influence relationships between stakeholders
function detectInfluenceRelationships(stakeholders: StakeholderData[]): Map<string, string[]> {
  const influences = new Map<string, string[]>();
  
  stakeholders.forEach(stakeholder => {
    const behavior = stakeholder.contact.behavior as { influencesIds?: string[] } | null;
    if (behavior?.influencesIds && behavior.influencesIds.length > 0) {
      influences.set(stakeholder.contact.id, behavior.influencesIds);
    }
  });
  
  return influences;
}

// Group stakeholders into coalitions using clustering
function clusterStakeholders(stakeholders: StakeholderData[]): Coalition[] {
  if (stakeholders.length === 0) return [];
  
  const coalitions: Coalition[] = [];
  const assigned = new Set<string>();
  
  // First, group by support level (main clustering criteria)
  const supportGroups = {
    champions: stakeholders.filter(s => s.metrics.support >= 3),
    supporters: stakeholders.filter(s => s.metrics.support >= 1 && s.metrics.support < 3),
    neutrals: stakeholders.filter(s => s.metrics.support > -2 && s.metrics.support < 1),
    skeptics: stakeholders.filter(s => s.metrics.support >= -3 && s.metrics.support <= -2),
    blockers: stakeholders.filter(s => s.metrics.support < -3),
  };
  
  // Create coalition for champions/strong supporters
  if (supportGroups.champions.length + supportGroups.supporters.length >= 2) {
    const members = [...supportGroups.champions, ...supportGroups.supporters];
    members.forEach(m => assigned.add(m.contact.id));
    
    const leader = members.reduce((a, b) =>
      (a.metrics.power * a.metrics.influence) > (b.metrics.power * b.metrics.influence) ? a : b
    , members[0]);

    const cohesion = Math.max(0, 100 - (Math.max(...members.map(m => m.metrics.support)) - Math.min(...members.map(m => m.metrics.support))) * 10);
    
    coalitions.push({
      id: 'coalition-supporters',
      name: 'Aliados Estratégicos',
      type: 'support',
      members,
      strength: Math.round((members.reduce((sum, m) => sum + m.metrics.power + m.metrics.influence, 0) / (members.length * 2)) * 10),
      influence: members.reduce((sum, m) => sum + m.metrics.influence, 0),
      cohesion: Math.round(cohesion),
      leader,
      characteristics: [
        'Alto nível de suporte',
        `${supportGroups.champions.length} champions identificados`,
        'Potencial para advocacy interno'
      ],
      strategy: 'Fortaleça essa coalizão e use-os como embaixadores internos. Mantenha comunicação frequente e forneça munição para defenderem internamente.',
      risk: 'low',
    });
  }
  
  // Create coalition for blockers/skeptics
  if (supportGroups.blockers.length + supportGroups.skeptics.length >= 1) {
    const members = [...supportGroups.blockers, ...supportGroups.skeptics];
    members.forEach(m => assigned.add(m.contact.id));
    
    const leader = members.length > 0 
      ? members.reduce((a, b) => (a.metrics.power * a.metrics.influence) > (b.metrics.power * b.metrics.influence) ? a : b, members[0])
      : undefined;
    
    const cohesion = members.length > 1 
      ? Math.max(0, 100 - (Math.max(...members.map(m => m.metrics.support)) - Math.min(...members.map(m => m.metrics.support))) * 10)
      : 50;
    
    coalitions.push({
      id: 'coalition-opposition',
      name: 'Oposição Identificada',
      type: 'opposition',
      members,
      strength: Math.round((members.reduce((sum, m) => sum + m.metrics.power + m.metrics.influence, 0) / (members.length * 2)) * 10),
      influence: members.reduce((sum, m) => sum + m.metrics.influence, 0),
      cohesion: Math.round(cohesion),
      leader,
      characteristics: [
        'Resistência à mudança',
        `${supportGroups.blockers.length} bloqueadores ativos`,
        'Requer estratégia de conversão'
      ],
      strategy: 'Identifique as objeções reais. Tente converter céticos antes de abordar bloqueadores. Considere neutralizar influência se conversão não for possível.',
      risk: members.some(m => m.metrics.power >= 7) ? 'high' : 'medium',
    });
  }
  
  // Create coalition for neutrals (potential swing voters)
  if (supportGroups.neutrals.length >= 2) {
    const members = supportGroups.neutrals.filter(m => !assigned.has(m.contact.id));
    if (members.length >= 2) {
      members.forEach(m => assigned.add(m.contact.id));
      
      coalitions.push({
        id: 'coalition-neutral',
        name: 'Neutros Influenciáveis',
        type: 'neutral',
        members,
        strength: Math.round((members.reduce((sum, m) => sum + m.metrics.power + m.metrics.influence, 0) / (members.length * 2)) * 10),
        influence: members.reduce((sum, m) => sum + m.metrics.influence, 0),
        cohesion: 40, // Neutrals typically have low cohesion
        characteristics: [
          'Posição indefinida',
          'Potencial para conversão',
          'Influenciáveis por ambos os lados'
        ],
        strategy: 'Priorize a conversão deste grupo. Eles podem decidir o resultado. Identifique o que precisam para se tornarem apoiadores.',
        risk: 'medium',
      });
    }
  }
  
  // Check for high-power clusters (organizational power centers)
  const highPowerStakeholders = stakeholders.filter(s => s.metrics.power >= 7 && !assigned.has(s.contact.id));
  if (highPowerStakeholders.length >= 2) {
    const hasMixedSupport = highPowerStakeholders.some(s => s.metrics.support >= 1) && 
                           highPowerStakeholders.some(s => s.metrics.support <= -1);
    
    coalitions.push({
      id: 'coalition-power-center',
      name: 'Centro de Poder',
      type: hasMixedSupport ? 'mixed' : (
        highPowerStakeholders.every(s => s.metrics.support >= 0) ? 'support' : 'opposition'
      ),
      members: highPowerStakeholders,
      strength: Math.round((highPowerStakeholders.reduce((sum, m) => sum + m.metrics.power, 0) / highPowerStakeholders.length) * 10),
      influence: highPowerStakeholders.reduce((sum, m) => sum + m.metrics.influence, 0),
      cohesion: hasMixedSupport ? 30 : 70,
      characteristics: [
        'Alto poder de decisão',
        'Grupo decisivo',
        hasMixedSupport ? 'Posições divididas' : 'Alinhados'
      ],
      strategy: hasMixedSupport 
        ? 'Este grupo está dividido. Foque em alinhar os decisores antes de avançar.'
        : 'Este é o grupo decisivo. Mantenha relacionamento próximo e alinhamento de expectativas.',
      risk: hasMixedSupport ? 'high' : 'medium',
    });
  }
  
  return coalitions;
}

// Detect influence clusters (who influences whom)
function detectInfluenceClusters(stakeholders: StakeholderData[]): InfluenceCluster[] {
  const clusters: InfluenceCluster[] = [];
  const influenceMap = detectInfluenceRelationships(stakeholders);
  
  // Find stakeholders who influence others
  stakeholders.forEach(stakeholder => {
    const influencedIds = influenceMap.get(stakeholder.contact.id) || [];
    const influenced = stakeholders.filter(s => influencedIds.includes(s.contact.id));
    
    if (influenced.length > 0) {
      clusters.push({
        id: `cluster-${stakeholder.contact.id}`,
        center: stakeholder,
        influenced,
        totalReach: influenced.length + influenced.reduce((sum, s) => {
          const theirInfluenced = influenceMap.get(s.contact.id) || [];
          return sum + theirInfluenced.length;
        }, 0),
        averageInfluenceStrength: stakeholder.metrics.influence,
      });
    }
  });
  
  // Sort by total reach
  clusters.sort((a, b) => b.totalReach - a.totalReach);
  
  return clusters;
}

// Detect key connections between stakeholders
function detectKeyConnections(stakeholders: StakeholderData[]): CoalitionAnalysis['keyConnections'] {
  const connections: CoalitionAnalysis['keyConnections'] = [];
  const influenceMap = detectInfluenceRelationships(stakeholders);
  
  // Influence connections
  stakeholders.forEach(stakeholder => {
    const influencedIds = influenceMap.get(stakeholder.contact.id) || [];
    influencedIds.forEach(influencedId => {
      const influenced = stakeholders.find(s => s.contact.id === influencedId);
      if (influenced) {
        connections.push({
          from: stakeholder,
          to: influenced,
          type: 'influence',
          strength: stakeholder.metrics.influence,
        });
      }
    });
  });
  
  // Alignment connections (similar support levels)
  for (let i = 0; i < stakeholders.length; i++) {
    for (let j = i + 1; j < stakeholders.length; j++) {
      const similarity = calculateSimilarity(stakeholders[i], stakeholders[j]);
      if (similarity >= 70) {
        connections.push({
          from: stakeholders[i],
          to: stakeholders[j],
          type: 'alignment',
          strength: similarity / 10,
        });
      }
    }
  }
  
  // Conflict connections (opposing support levels)
  for (let i = 0; i < stakeholders.length; i++) {
    for (let j = i + 1; j < stakeholders.length; j++) {
      const supportDiff = Math.abs(stakeholders[i].metrics.support - stakeholders[j].metrics.support);
      if (supportDiff >= 5 && stakeholders[i].metrics.power >= 5 && stakeholders[j].metrics.power >= 5) {
        connections.push({
          from: stakeholders[i],
          to: stakeholders[j],
          type: 'conflict',
          strength: supportDiff,
        });
      }
    }
  }
  
  return connections;
}

// Calculate power balance
function calculatePowerBalance(stakeholders: StakeholderData[]): CoalitionAnalysis['powerBalance'] {
  let supportPower = 0;
  let oppositionPower = 0;
  let neutralPower = 0;
  
  stakeholders.forEach(s => {
    const power = s.metrics.power * s.metrics.influence;
    if (s.metrics.support >= 2) {
      supportPower += power;
    } else if (s.metrics.support <= -2) {
      oppositionPower += power;
    } else {
      neutralPower += power;
    }
  });
  
  const total = supportPower + oppositionPower + neutralPower;
  const normalizedSupport = total > 0 ? Math.round((supportPower / total) * 100) : 0;
  const normalizedOpposition = total > 0 ? Math.round((oppositionPower / total) * 100) : 0;
  const normalizedNeutral = total > 0 ? Math.round((neutralPower / total) * 100) : 0;
  
  let balance: 'favorable' | 'unfavorable' | 'contested';
  let recommendation: string;
  
  if (normalizedSupport > normalizedOpposition + 20) {
    balance = 'favorable';
    recommendation = 'Momento favorável para avançar. Aproveite o suporte para acelerar decisões.';
  } else if (normalizedOpposition > normalizedSupport + 20) {
    balance = 'unfavorable';
    recommendation = 'Balanço desfavorável. Foque em converter neutros e reduzir objeções antes de avançar.';
  } else {
    balance = 'contested';
    recommendation = 'Situação equilibrada. Os neutros podem decidir o resultado. Priorize sua conversão.';
  }
  
  return {
    supportPower: normalizedSupport,
    oppositionPower: normalizedOpposition,
    neutralPower: normalizedNeutral,
    balance,
    recommendation,
  };
}

// Generate insights from the analysis
function generateInsights(
  coalitions: Coalition[],
  clusters: InfluenceCluster[],
  powerBalance: CoalitionAnalysis['powerBalance'],
  stakeholders: StakeholderData[]
): string[] {
  const insights: string[] = [];
  
  // Coalition insights
  const supportCoalition = coalitions.find(c => c.type === 'support');
  const oppositionCoalition = coalitions.find(c => c.type === 'opposition');
  
  if (supportCoalition && supportCoalition.members.length >= 3) {
    insights.push(`✅ Coalizão de apoio forte com ${supportCoalition.members.length} membros. Use ${supportCoalition.leader?.contact.first_name} como líder informal.`);
  }
  
  if (oppositionCoalition && oppositionCoalition.risk === 'high') {
    insights.push(`⚠️ Oposição de alto risco identificada. ${oppositionCoalition.leader?.contact.first_name} lidera a resistência com poder significativo.`);
  }
  
  // Influence cluster insights
  if (clusters.length > 0) {
    const topInfluencer = clusters[0];
    insights.push(`🔗 ${topInfluencer.center.contact.first_name} é o principal influenciador, alcançando ${topInfluencer.totalReach} stakeholders.`);
    
    if (topInfluencer.center.metrics.support < 0) {
      insights.push(`🚨 Atenção: O principal influenciador tem posição negativa. Priorize sua conversão.`);
    }
  }
  
  // Power balance insights
  if (powerBalance.balance === 'contested') {
    const neutralCount = stakeholders.filter(s => s.metrics.support > -2 && s.metrics.support < 2).length;
    insights.push(`⚖️ ${neutralCount} stakeholders neutros podem decidir o resultado. Desenvolva estratégia para cada um.`);
  }
  
  // Risk patterns
  const highRiskCoalitions = coalitions.filter(c => c.risk === 'high');
  if (highRiskCoalitions.length > 0) {
    insights.push(`🔴 ${highRiskCoalitions.length} coalizão(ões) de alto risco identificada(s). Ação imediata recomendada.`);
  }
  
  // Missing connections
  const isolated = stakeholders.filter(s => {
    return !clusters.some(c => c.center.contact.id === s.contact.id || c.influenced.some(i => i.contact.id === s.contact.id));
  });
  if (isolated.length > 0 && isolated.length < stakeholders.length) {
    insights.push(`📍 ${isolated.length} stakeholder(s) isolado(s) sem conexões de influência mapeadas.`);
  }
  
  return insights;
}

export function useCoalitionDetection(stakeholders: StakeholderData[]): CoalitionAnalysis {
  return useMemo(() => {
    if (stakeholders.length === 0) {
      return {
        coalitions: [],
        influenceClusters: [],
        powerBalance: {
          supportPower: 0,
          oppositionPower: 0,
          neutralPower: 0,
          balance: 'contested',
          recommendation: 'Adicione stakeholders para analisar coalizões.',
        },
        keyConnections: [],
        insights: ['Adicione stakeholders para detectar coalizões e grupos de influência.'],
      };
    }
    
    const coalitions = clusterStakeholders(stakeholders);
    const influenceClusters = detectInfluenceClusters(stakeholders);
    const powerBalance = calculatePowerBalance(stakeholders);
    const keyConnections = detectKeyConnections(stakeholders);
    const insights = generateInsights(coalitions, influenceClusters, powerBalance, stakeholders);
    
    return {
      coalitions,
      influenceClusters,
      powerBalance,
      keyConnections,
      insights,
    };
  }, [stakeholders]);
}
