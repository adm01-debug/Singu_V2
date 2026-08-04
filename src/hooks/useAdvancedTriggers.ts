// ==============================================
// ADVANCED TRIGGERS HOOK - Enterprise Mental Trigger Analysis
// Provides trigger chains, saturation detection, timing, and A/B testing
// ==============================================

import { useMemo, useCallback, useState } from 'react';
import { Contact } from '@/types';
import { TriggerType, MENTAL_TRIGGERS } from '@/types/triggers';
import {
  AllTriggerTypes,
  TriggerChain,
  TriggerConflict,
  TriggerSynergy,
  TriggerExposure,
  ResistanceProfile,
  TriggerTimingRecommendation,
  AdvancedTriggerAnalysis,
} from '@/types/triggers-advanced';
import {
  ADVANCED_MENTAL_TRIGGERS,
  VALIDATED_TRIGGER_CHAINS,
  TRIGGER_CONFLICTS,
  TRIGGER_SYNERGIES,
  NEUROCHEMICAL_TIMING,
  TRIGGER_FALLBACKS,
  INTENSITY_LEVELS,
} from '@/data/triggersAdvancedData';
import { useTriggerHistory } from './useTriggerHistory';
import { differenceInHours, parseISO } from 'date-fns';

// ============================================
// SATURATION THRESHOLDS
// ============================================
const SATURATION_CONFIG = {
  EXPOSURE_WINDOW_DAYS: 30,
  COOLDOWN_HOURS: 72,
  SATURATION_LEVELS: {
    none: { min: 0, max: 1 },
    low: { min: 2, max: 3 },
    medium: { min: 4, max: 5 },
    high: { min: 6, max: Infinity },
  },
};

export function useAdvancedTriggers(contact: Contact | null | undefined) {
  const { history } = useTriggerHistory(contact?.id);
  const [resistanceScore, setResistanceScore] = useState(0);

  // ============================================
  // EXPOSURE & SATURATION ANALYSIS
  // ============================================
  const exposureAnalysis = useMemo<TriggerExposure[]>(() => {
    if (!history || history.length === 0) return [];

    const now = new Date();
    const windowStart = new Date(now.getTime() - SATURATION_CONFIG.EXPOSURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // Group history by trigger type
    const exposureMap = new Map<string, TriggerExposure>();

    history
      .filter(h => new Date(h.used_at) >= windowStart)
      .forEach(entry => {
        const existing = exposureMap.get(entry.trigger_type);
        const rating = entry.effectiveness_rating || 5;

        if (existing) {
          existing.exposureCount++;
          existing.effectiveness.push(rating);
          if (new Date(entry.used_at) > new Date(existing.lastExposedAt)) {
            existing.lastExposedAt = entry.used_at;
          }
        } else {
          exposureMap.set(entry.trigger_type, {
            contactId: contact?.id || '',
            triggerId: entry.trigger_type as AllTriggerTypes,
            exposureCount: 1,
            lastExposedAt: entry.used_at,
            effectiveness: [rating],
            averageEffectiveness: rating,
            saturated: false,
            saturationLevel: 'none',
          });
        }
      });

    // Calculate saturation for each trigger
    return Array.from(exposureMap.values()).map(exposure => {
      const avgEffectiveness = exposure.effectiveness.reduce((a, b) => a + b, 0) / exposure.effectiveness.length;
      const count = exposure.exposureCount;
      
      // Get threshold from advanced triggers or default
      const advancedTrigger = ADVANCED_MENTAL_TRIGGERS[exposure.triggerId as keyof typeof ADVANCED_MENTAL_TRIGGERS];
      const threshold = advancedTrigger?.saturationThreshold || 4;

      let saturationLevel: TriggerExposure['saturationLevel'] = 'none';
      if (count >= threshold * 2) saturationLevel = 'high';
      else if (count >= threshold * 1.5) saturationLevel = 'medium';
      else if (count >= threshold) saturationLevel = 'low';

      const hoursSinceLastUse = differenceInHours(now, parseISO(exposure.lastExposedAt));
      const needsCooldown = saturationLevel !== 'none' && hoursSinceLastUse < SATURATION_CONFIG.COOLDOWN_HOURS;

      return {
        ...exposure,
        averageEffectiveness: avgEffectiveness,
        saturated: saturationLevel === 'high' || saturationLevel === 'medium',
        saturationLevel,
        cooldownUntil: needsCooldown 
          ? new Date(parseISO(exposure.lastExposedAt).getTime() + SATURATION_CONFIG.COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()
          : undefined,
      };
    });
  }, [history, contact?.id]);

  // ============================================
  // RESISTANCE DETECTION
  // ============================================
  const resistanceProfile = useMemo<ResistanceProfile | null>(() => {
    if (!contact || !history || history.length === 0) return null;

    const recentHistory = history.slice(0, 20); // Last 20 interactions
    const failures = recentHistory.filter(h => h.result === 'failure').length;
    const neutrals = recentHistory.filter(h => h.result === 'neutral').length;

    // Calculate overall resistance
    const overallResistance = Math.min(100, (failures * 15) + (neutrals * 5));
    setResistanceScore(overallResistance);

    // Detect immunities (triggers that consistently fail)
    const triggerResults = new Map<string, { success: number; failure: number }>();
    recentHistory.forEach(h => {
      const existing = triggerResults.get(h.trigger_type) || { success: 0, failure: 0 };
      if (h.result === 'success') existing.success++;
      else if (h.result === 'failure') existing.failure++;
      triggerResults.set(h.trigger_type, existing);
    });

    const immunities: AllTriggerTypes[] = [];
    triggerResults.forEach((stats, triggerId) => {
      if (stats.failure >= 2 && stats.failure > stats.success * 2) {
        immunities.push(triggerId as AllTriggerTypes);
      }
    });

    // Detect defense patterns based on notes/context in history
    const defenses: ResistanceProfile['detectedDefenses'] = [];
    const allNotes = recentHistory.map(h => h.notes || '').join(' ').toLowerCase();

    if (allNotes.includes('preço') || allNotes.includes('caro') || allNotes.includes('budget')) {
      defenses.push({ type: 'price_anchor', strength: 7, indicators: ['Foco em preço', 'Objeção de valor'] });
    }
    if (allNotes.includes('pensar') || allNotes.includes('analisar') || allNotes.includes('tempo')) {
      defenses.push({ type: 'analysis_paralysis', strength: 6, indicators: ['Precisa pensar', 'Quer analisar mais'] });
    }
    if (allNotes.includes('depois') || allNotes.includes('próximo') || allNotes.includes('não agora')) {
      defenses.push({ type: 'delay_tactic', strength: 5, indicators: ['Adiando decisão'] });
    }

    // Determine recommended approach
    let recommendedApproach: ResistanceProfile['recommendedApproach'] = 'indirect';
    if (overallResistance > 70) recommendedApproach = 'relationship_first';
    else if (overallResistance > 50) recommendedApproach = 'evidence_heavy';
    else if (overallResistance > 30) recommendedApproach = 'reduce_pressure';

    return {
      contactId: contact.id,
      overallResistance,
      triggerImmunities: immunities,
      detectedDefenses: defenses,
      recommendedApproach,
      antiPatterns: immunities.map(t => `Evite usar ${MENTAL_TRIGGERS[t as TriggerType]?.name || t}`),
    };
  }, [contact, history]);

  // ============================================
  // OPTIMAL TIMING CALCULATION
  // ============================================
  const getOptimalTiming = useCallback((triggerId: AllTriggerTypes): TriggerTimingRecommendation => {
    const advancedTrigger = ADVANCED_MENTAL_TRIGGERS[triggerId as keyof typeof ADVANCED_MENTAL_TRIGGERS];
    const primaryChemical = advancedTrigger?.primaryChemical || 'dopamine';
    
    const timing = NEUROCHEMICAL_TIMING.find(t => t.chemical === primaryChemical);
    
    if (!timing) {
      return {
        triggerId,
        bestHours: [10, 11, 14, 15],
        bestDays: ['terça', 'quarta', 'quinta'],
        neurochemicalReason: 'Horário padrão de alta receptividade',
        confidenceScore: 60,
      };
    }

    const dayNames: Record<string, string> = {
      monday: 'segunda',
      tuesday: 'terça',
      wednesday: 'quarta',
      thursday: 'quinta',
      friday: 'sexta',
    };

    return {
      triggerId,
      bestHours: timing.optimalHours,
      bestDays: timing.peakDays.map(d => dayNames[d] || d),
      neurochemicalReason: timing.reasoning,
      confidenceScore: 85,
    };
  }, []);

  // ============================================
  // RECOMMENDED CHAINS
  // ============================================
  const recommendedChains = useMemo<TriggerChain[]>(() => {
    if (!contact) return [];

    const discProfile = contact.behavior?.discProfile;
    const stage = contact.relationshipStage;

    return VALIDATED_TRIGGER_CHAINS
      .filter(chain => {
        // Filter by DISC if available
        if (discProfile && chain.bestFor.length > 0) {
          if (!chain.bestFor.includes(discProfile)) return false;
        }
        // Filter by scenario if stage matches
        if (stage === 'negotiation' && chain.scenario === 'negotiation') return true;
        if (stage === 'lost' && chain.scenario === 'lost_client_reactivation') return true;
        if (stage === 'prospect' && chain.scenario === 'initial_negotiation') return true;
        // Include universal chains
        return chain.bestFor.includes(discProfile || 'I');
      })
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 4);
  }, [contact]);

  // ============================================
  // CONFLICT DETECTION
  // ============================================
  const detectConflicts = useCallback((recentTriggers: AllTriggerTypes[]): TriggerConflict[] => {
    const conflicts: TriggerConflict[] = [];

    for (let i = 0; i < recentTriggers.length; i++) {
      for (let j = i + 1; j < recentTriggers.length; j++) {
        const conflict = TRIGGER_CONFLICTS.find(
          c => (c.trigger1 === recentTriggers[i] && c.trigger2 === recentTriggers[j]) ||
               (c.trigger1 === recentTriggers[j] && c.trigger2 === recentTriggers[i])
        );
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }

    return conflicts;
  }, []);

  // ============================================
  // SYNERGY RECOMMENDATIONS
  // ============================================
  const getSynergies = useCallback((triggerId: AllTriggerTypes): TriggerSynergy[] => {
    return TRIGGER_SYNERGIES.filter(
      s => s.trigger1 === triggerId || s.trigger2 === triggerId
    ).sort((a, b) => b.synergyLevel - a.synergyLevel);
  }, []);

  // ============================================
  // FALLBACK RECOMMENDATIONS
  // ============================================
  const getFallbacks = useCallback((triggerId: AllTriggerTypes, failureIndicator?: string) => {
    const fallbackTree = TRIGGER_FALLBACKS.find(f => f.primaryTrigger === triggerId);
    if (!fallbackTree) return [];

    return fallbackTree.fallbackSequence.map(f => ({
      ...f,
      triggerInfo: MENTAL_TRIGGERS[f.trigger as TriggerType] || 
                   ADVANCED_MENTAL_TRIGGERS[f.trigger as keyof typeof ADVANCED_MENTAL_TRIGGERS],
    }));
  }, []);

  // ============================================
  // INTENSITY RECOMMENDATION
  // ============================================
  const getRecommendedIntensity = useCallback((triggerId: AllTriggerTypes): number => {
    if (!contact) return 2;

    const discProfile = contact.behavior?.discProfile;
    const exposure = exposureAnalysis.find(e => e.triggerId === triggerId);

    // Base intensity on DISC profile
    let baseIntensity = 2;
    if (discProfile === 'D') baseIntensity = 4;
    else if (discProfile === 'I') baseIntensity = 3;
    else if (discProfile === 'S') baseIntensity = 1;

    // Adjust for saturation
    if (exposure?.saturationLevel === 'high') baseIntensity = Math.max(1, baseIntensity - 2);
    if (exposure?.saturationLevel === 'medium') baseIntensity = Math.max(1, baseIntensity - 1);

    // Adjust for resistance
    if (resistanceScore > 70) baseIntensity = Math.max(1, baseIntensity - 2);
    if (resistanceScore > 50) baseIntensity = Math.max(1, baseIntensity - 1);

    return Math.min(5, Math.max(1, baseIntensity));
  }, [contact, exposureAnalysis, resistanceScore]);

  // ============================================
  // FULL ANALYSIS
  // ============================================
  const fullAnalysis = useMemo<AdvancedTriggerAnalysis | null>(() => {
    if (!contact) return null;

    const recentTriggerIds = (history || [])
      .slice(0, 5)
      .map(h => h.trigger_type as AllTriggerTypes);

    const conflicts = detectConflicts(recentTriggerIds);

    // Get optimal timing based on DISC
    const discProfile = contact.behavior?.discProfile;
    let optimalDay = 'quarta';
    let optimalHours: [number, number] = [10, 16];
    let neurochemicalReason = 'Horário padrão de receptividade';

    if (discProfile === 'D') {
      optimalHours = [8, 11];
      optimalDay = 'segunda';
      neurochemicalReason = 'Dominantes respondem bem a cortisol matinal (urgência/ação)';
    } else if (discProfile === 'I') {
      optimalHours = [14, 17];
      optimalDay = 'quinta';
      neurochemicalReason = 'Influenciadores têm dopamina alta à tarde (entusiasmo)';
    } else if (discProfile === 'S') {
      optimalHours = [10, 15];
      neurochemicalReason = 'Estáveis preferem oxitocina estável (conexão calma)';
    } else if (discProfile === 'C') {
      optimalHours = [10, 14];
      optimalDay = 'terça';
      neurochemicalReason = 'Conformes têm serotonina alta pela manhã (análise)';
    }

    return {
      contactId: contact.id,
      saturationReport: exposureAnalysis.map(e => ({
        triggerId: e.triggerId,
        saturationLevel: e.saturated ? 80 : e.saturationLevel === 'low' ? 40 : 10,
        usesInLast30Days: e.exposureCount,
        recommendCooldown: e.saturated,
      })),
      resistanceScore,
      detectedDefenses: resistanceProfile?.detectedDefenses.map(d => d.type) || [],
      optimalContactWindow: {
        dayOfWeek: optimalDay,
        hourRange: optimalHours,
        neurochemicalReason,
      },
      recommendedChains,
      activeTests: [], // Would come from database
      conflictWarnings: conflicts.map(c => ({
        recentTrigger: c.trigger1,
        conflictsWith: [c.trigger2],
        severity: c.conflictLevel,
      })),
    };
  }, [contact, history, exposureAnalysis, resistanceScore, resistanceProfile, recommendedChains, detectConflicts]);

  return {
    // Data
    advancedTriggers: ADVANCED_MENTAL_TRIGGERS,
    triggerChains: VALIDATED_TRIGGER_CHAINS,
    intensityLevels: INTENSITY_LEVELS,
    
    // Analysis
    exposureAnalysis,
    resistanceProfile,
    resistanceScore,
    fullAnalysis,
    recommendedChains,
    
    // Functions
    getOptimalTiming,
    detectConflicts,
    getSynergies,
    getFallbacks,
    getRecommendedIntensity,
    
    // Static data
    conflicts: TRIGGER_CONFLICTS,
    synergies: TRIGGER_SYNERGIES,
    neurochemicalTiming: NEUROCHEMICAL_TIMING,
    fallbackTrees: TRIGGER_FALLBACKS,
  };
}
