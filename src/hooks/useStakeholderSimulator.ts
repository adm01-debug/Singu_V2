import { useState, useMemo, useCallback } from 'react';
import type { StakeholderData, StakeholderMetrics } from './useStakeholderAnalysis';

export interface SimulatedChange {
  contactId: string;
  contactName: string;
  originalMetrics: StakeholderMetrics;
  newMetrics: Partial<StakeholderMetrics>;
  action: 'convert' | 'neutralize' | 'boost' | 'custom';
  description: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  changes: SimulatedChange[];
  createdAt: Date;
}

export interface SimulationResult {
  originalPowerBalance: PowerBalance;
  simulatedPowerBalance: PowerBalance;
  originalRiskScore: number;
  simulatedRiskScore: number;
  improvements: string[];
  risks: string[];
  recommendation: string;
  successProbability: number;
  effortRequired: 'low' | 'medium' | 'high';
  timeEstimate: string;
}

interface PowerBalance {
  supportPower: number;
  oppositionPower: number;
  neutralPower: number;
  balance: 'favorable' | 'unfavorable' | 'contested';
}

function calculatePowerBalance(stakeholders: StakeholderData[]): PowerBalance {
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
  if (normalizedSupport > normalizedOpposition + 20) {
    balance = 'favorable';
  } else if (normalizedOpposition > normalizedSupport + 20) {
    balance = 'unfavorable';
  } else {
    balance = 'contested';
  }

  return {
    supportPower: normalizedSupport,
    oppositionPower: normalizedOpposition,
    neutralPower: normalizedNeutral,
    balance,
  };
}

function calculateRiskScore(stakeholders: StakeholderData[]): number {
  const blockers = stakeholders.filter(s => s.metrics.support <= -2);
  const highPowerBlockers = blockers.filter(s => s.metrics.power >= 7);
  const champions = stakeholders.filter(s => s.metrics.support >= 3);
  
  let riskScore = 0;
  riskScore += blockers.length * 15;
  riskScore += highPowerBlockers.length * 25;
  riskScore -= champions.length * 10;
  
  return Math.min(100, Math.max(0, riskScore));
}

function applyChangesToStakeholders(
  stakeholders: StakeholderData[],
  changes: SimulatedChange[]
): StakeholderData[] {
  return stakeholders.map(s => {
    const change = changes.find(c => c.contactId === s.contact.id);
    if (!change) return s;

    return {
      ...s,
      metrics: {
        ...s.metrics,
        ...change.newMetrics,
      },
    };
  });
}

function calculateEffort(changes: SimulatedChange[]): 'low' | 'medium' | 'high' {
  const totalSupportChange = changes.reduce((sum, c) => {
    const originalSupport = c.originalMetrics.support;
    const newSupport = c.newMetrics.support ?? originalSupport;
    return sum + Math.abs(newSupport - originalSupport);
  }, 0);

  if (totalSupportChange <= 3) return 'low';
  if (totalSupportChange <= 8) return 'medium';
  return 'high';
}

function calculateSuccessProbability(
  changes: SimulatedChange[],
  stakeholders: StakeholderData[]
): number {
  let probability = 70; // Base probability

  changes.forEach(change => {
    const stakeholder = stakeholders.find(s => s.contact.id === change.contactId);
    if (!stakeholder) return;

    const supportChange = (change.newMetrics.support ?? stakeholder.metrics.support) - stakeholder.metrics.support;
    
    // Converting blockers is harder
    if (stakeholder.metrics.support <= -3 && supportChange > 0) {
      probability -= 15;
    }
    
    // High power stakeholders are harder to change
    if (stakeholder.metrics.power >= 8) {
      probability -= 10;
    }
    
    // Low engagement makes it harder
    if (stakeholder.metrics.engagement <= 3) {
      probability -= 5;
    }
    
    // Large changes are harder
    if (Math.abs(supportChange) >= 4) {
      probability -= 10;
    }
  });

  return Math.min(95, Math.max(10, probability));
}

function estimateTime(changes: SimulatedChange[]): string {
  const effort = calculateEffort(changes);
  
  switch (effort) {
    case 'low': return '2-4 semanas';
    case 'medium': return '1-2 meses';
    case 'high': return '3-6 meses';
  }
}

function generateImprovements(
  original: PowerBalance,
  simulated: PowerBalance,
  originalRisk: number,
  simulatedRisk: number
): string[] {
  const improvements: string[] = [];

  if (simulated.supportPower > original.supportPower) {
    improvements.push(`Aumento de ${simulated.supportPower - original.supportPower}% no poder de apoio`);
  }

  if (simulated.oppositionPower < original.oppositionPower) {
    improvements.push(`Redução de ${original.oppositionPower - simulated.oppositionPower}% no poder de oposição`);
  }

  if (simulated.balance === 'favorable' && original.balance !== 'favorable') {
    improvements.push('Balanço de poder se torna favorável');
  }

  if (simulatedRisk < originalRisk) {
    improvements.push(`Redução de ${originalRisk - simulatedRisk}% no score de risco`);
  }

  if (simulated.neutralPower < original.neutralPower && simulated.supportPower > original.supportPower) {
    improvements.push('Conversão de neutros para apoiadores');
  }

  return improvements;
}

function generateRisks(changes: SimulatedChange[], stakeholders: StakeholderData[]): string[] {
  const risks: string[] = [];

  changes.forEach(change => {
    const stakeholder = stakeholders.find(s => s.contact.id === change.contactId);
    if (!stakeholder) return;

    // Aggressive conversion of blockers
    if (stakeholder.metrics.support <= -3 && (change.newMetrics.support ?? 0) >= 2) {
      risks.push(`Conversão agressiva de ${change.contactName} pode gerar resistência`);
    }

    // High power stakeholder manipulation
    if (stakeholder.metrics.power >= 8) {
      risks.push(`${change.contactName} tem alto poder - mudanças podem ter consequências amplas`);
    }
  });

  // Check for isolated changes
  if (changes.length === 1) {
    risks.push('Mudança isolada pode não ser suficiente para alterar o balanço');
  }

  return risks.slice(0, 3); // Limit to 3 risks
}

function generateRecommendation(
  result: Omit<SimulationResult, 'recommendation'>
): string {
  if (result.successProbability >= 70 && result.effortRequired !== 'high') {
    return 'Cenário viável com boa probabilidade de sucesso. Recomendado prosseguir com a estratégia.';
  }

  if (result.successProbability >= 50 && result.improvements.length > 0) {
    return 'Cenário moderadamente viável. Considere dividir em etapas menores para aumentar chances de sucesso.';
  }

  if (result.successProbability < 50) {
    return 'Cenário de alto risco. Recomenda-se revisar a estratégia ou focar em alvos mais acessíveis primeiro.';
  }

  return 'Avalie os riscos cuidadosamente antes de prosseguir.';
}

export function useStakeholderSimulator(stakeholders: StakeholderData[]) {
  const [changes, setChanges] = useState<SimulatedChange[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SimulationScenario[]>([]);

  const addChange = useCallback((change: SimulatedChange) => {
    setChanges(prev => {
      const existing = prev.findIndex(c => c.contactId === change.contactId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = change;
        return updated;
      }
      return [...prev, change];
    });
  }, []);

  const removeChange = useCallback((contactId: string) => {
    setChanges(prev => prev.filter(c => c.contactId !== contactId));
  }, []);

  const clearChanges = useCallback(() => {
    setChanges([]);
  }, []);

  const applyPreset = useCallback((preset: 'convert_blockers' | 'boost_champions' | 'convert_neutrals') => {
    const newChanges: SimulatedChange[] = [];

    switch (preset) {
      case 'convert_blockers':
        stakeholders
          .filter(s => s.metrics.support <= -2)
          .forEach(s => {
            newChanges.push({
              contactId: s.contact.id,
              contactName: `${s.contact.first_name} ${s.contact.last_name}`,
              originalMetrics: s.metrics,
              newMetrics: { support: 0 },
              action: 'neutralize',
              description: 'Neutralizar bloqueador',
            });
          });
        break;

      case 'boost_champions':
        stakeholders
          .filter(s => s.metrics.support >= 2 && s.metrics.support < 5)
          .forEach(s => {
            newChanges.push({
              contactId: s.contact.id,
              contactName: `${s.contact.first_name} ${s.contact.last_name}`,
              originalMetrics: s.metrics,
              newMetrics: { support: 5, engagement: Math.min(10, s.metrics.engagement + 2) },
              action: 'boost',
              description: 'Fortalecer como champion',
            });
          });
        break;

      case 'convert_neutrals':
        stakeholders
          .filter(s => s.metrics.support > -2 && s.metrics.support < 2)
          .forEach(s => {
            newChanges.push({
              contactId: s.contact.id,
              contactName: `${s.contact.first_name} ${s.contact.last_name}`,
              originalMetrics: s.metrics,
              newMetrics: { support: 3 },
              action: 'convert',
              description: 'Converter para apoiador',
            });
          });
        break;
    }

    setChanges(newChanges);
  }, [stakeholders]);

  const saveScenario = useCallback((name: string, description: string) => {
    const scenario: SimulationScenario = {
      id: `scenario-${Date.now()}`,
      name,
      description,
      changes: [...changes],
      createdAt: new Date(),
    };
    setSavedScenarios(prev => [...prev, scenario]);
    return scenario;
  }, [changes]);

  const loadScenario = useCallback((scenario: SimulationScenario) => {
    setChanges(scenario.changes);
  }, []);

  const deleteScenario = useCallback((scenarioId: string) => {
    setSavedScenarios(prev => prev.filter(s => s.id !== scenarioId));
  }, []);

  const simulationResult = useMemo((): SimulationResult | null => {
    if (changes.length === 0) return null;

    const originalPowerBalance = calculatePowerBalance(stakeholders);
    const originalRiskScore = calculateRiskScore(stakeholders);

    const simulatedStakeholders = applyChangesToStakeholders(stakeholders, changes);
    const simulatedPowerBalance = calculatePowerBalance(simulatedStakeholders);
    const simulatedRiskScore = calculateRiskScore(simulatedStakeholders);

    const improvements = generateImprovements(
      originalPowerBalance,
      simulatedPowerBalance,
      originalRiskScore,
      simulatedRiskScore
    );

    const risks = generateRisks(changes, stakeholders);
    const effortRequired = calculateEffort(changes);
    const successProbability = calculateSuccessProbability(changes, stakeholders);
    const timeEstimate = estimateTime(changes);

    const partialResult = {
      originalPowerBalance,
      simulatedPowerBalance,
      originalRiskScore,
      simulatedRiskScore,
      improvements,
      risks,
      successProbability,
      effortRequired,
      timeEstimate,
    };

    return {
      ...partialResult,
      recommendation: generateRecommendation(partialResult),
    };
  }, [stakeholders, changes]);

  return {
    changes,
    addChange,
    removeChange,
    clearChanges,
    applyPreset,
    savedScenarios,
    saveScenario,
    loadScenario,
    deleteScenario,
    simulationResult,
  };
}
