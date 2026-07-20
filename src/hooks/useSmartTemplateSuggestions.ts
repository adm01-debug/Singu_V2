import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { PersuasionTemplate, MENTAL_TRIGGERS, TriggerType, PersuasionScenario } from '@/types/triggers';
import { Contact } from '@/types';
import { logger } from "@/lib/logger";

type DISCProfile = 'D' | 'I' | 'S' | 'C';

export interface TemplateSuccessData {
  templateId: string;
  templateTitle: string;
  triggerType: TriggerType;
  scenario: PersuasionScenario | null;
  totalUsages: number;
  successCount: number;
  successRate: number;
  avgRating: number;
  discPerformance: Record<DISCProfile, { usages: number; successRate: number }>;
}

export interface SmartSuggestion {
  template: PersuasionTemplate;
  reason: string;
  score: number;
  successData: TemplateSuccessData | null;
  isPersonalized: boolean;
  tag: 'top_performer' | 'disc_match' | 'rising_star' | 'recommended';
}

export function useSmartTemplateSuggestions(contact: Contact) {
  const { user } = useAuth();
  const { allTemplates, analysis } = useClientTriggers(contact);
  const { createUsage } = useTriggerHistory(contact.id);
  const [loading, setLoading] = useState(true);
  const [templateStats, setTemplateStats] = useState<Map<string, TemplateSuccessData>>(new Map());

  const contactDISC = contact.behavior?.discProfile as DISCProfile | undefined;

  const fetchTemplateStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: usageHistory, error } = await supabase
        .from('trigger_usage_history')
        .select('id, trigger_type, template_id, template_title, scenario, result, effectiveness_rating, contact_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, behavior')
        .eq('user_id', user.id);

      if (contactsError) throw contactsError;

      const contactDISCMap = new Map<string, DISCProfile | null>();
      contacts?.forEach((c) => {
        const behavior = c.behavior as { discProfile?: string } | null;
        contactDISCMap.set(c.id, (behavior?.discProfile as DISCProfile) || null);
      });

      const statsMap = new Map<string, TemplateSuccessData>();

      usageHistory?.forEach((usage) => {
        if (!usage.template_id) return;
        const existing = statsMap.get(usage.template_id);
        const usageDISC = contactDISCMap.get(usage.contact_id);

        if (!existing) {
          statsMap.set(usage.template_id, {
            templateId: usage.template_id,
            templateTitle: usage.template_title || '',
            triggerType: usage.trigger_type as TriggerType,
            scenario: usage.scenario as PersuasionScenario | null,
            totalUsages: 1,
            successCount: usage.result === 'success' ? 1 : 0,
            successRate: 0,
            avgRating: usage.effectiveness_rating || 0,
            discPerformance: {
              D: { usages: 0, successRate: 0 },
              I: { usages: 0, successRate: 0 },
              S: { usages: 0, successRate: 0 },
              C: { usages: 0, successRate: 0 },
            },
          });

          if (usageDISC) {
            statsMap.get(usage.template_id)!.discPerformance[usageDISC].usages = 1;
            if (usage.result === 'success') {
              statsMap.get(usage.template_id)!.discPerformance[usageDISC].successRate = 100;
            }
          }
        } else {
          existing.totalUsages++;
          if (usage.result === 'success') existing.successCount++;
          if (usage.effectiveness_rating) {
            existing.avgRating = (existing.avgRating * (existing.totalUsages - 1) + usage.effectiveness_rating) / existing.totalUsages;
          }
          if (usageDISC) {
            const discStats = existing.discPerformance[usageDISC];
            const prevSuccesses = Math.round(discStats.usages * discStats.successRate / 100);
            discStats.usages++;
            const newSuccesses = prevSuccesses + (usage.result === 'success' ? 1 : 0);
            discStats.successRate = (newSuccesses / discStats.usages) * 100;
          }
        }
      });

      statsMap.forEach((stat) => {
        stat.successRate = stat.totalUsages > 0 ? (stat.successCount / stat.totalUsages) * 100 : 0;
      });

      setTemplateStats(statsMap);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching template stats:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplateStats();
  }, [fetchTemplateStats]);

  const suggestions = useMemo<SmartSuggestion[]>(() => {
    if (!allTemplates.length) return [];

    const scored: SmartSuggestion[] = [];

    allTemplates.forEach((template) => {
      if (template.discProfile && template.discProfile !== contactDISC) return;

      const stats = templateStats.get(template.id);
      const trigger = MENTAL_TRIGGERS[template.trigger as TriggerType];
      const triggerSuggestion = analysis?.primaryTriggers.find(t => t.trigger.id === template.trigger);

      let score = 0;
      let reason = '';
      let tag: SmartSuggestion['tag'] = 'recommended';
      let isPersonalized = false;

      if (stats && stats.totalUsages >= 2) {
        score += Math.min(40, stats.successRate * 0.4);
        if (stats.successRate >= 70 && stats.totalUsages >= 3) {
          tag = 'top_performer';
          reason = `Taxa de sucesso de ${stats.successRate.toFixed(0)}% em ${stats.totalUsages} usos`;
        }
      }

      if (stats && contactDISC && stats.discPerformance[contactDISC].usages >= 2) {
        const discRate = stats.discPerformance[contactDISC].successRate;
        score += Math.min(30, discRate * 0.3);
        isPersonalized = true;
        if (discRate > stats.successRate && discRate >= 60) {
          tag = 'disc_match';
          reason = `${discRate.toFixed(0)}% de sucesso com perfil ${contactDISC}`;
        }
      }

      if (triggerSuggestion) {
        score += Math.min(20, triggerSuggestion.matchScore * 0.2);
        if (!reason) reason = triggerSuggestion.reason;
      }

      if (stats && stats.avgRating > 0) {
        score += stats.avgRating * 2;
      }

      if (stats && stats.totalUsages >= 3 && stats.successRate >= 50) {
        if (tag === 'recommended') {
          tag = 'rising_star';
          reason = reason || 'Template em crescimento com bons resultados';
        }
      }

      if (score < 10 && !stats) {
        score = 10 + (triggerSuggestion?.matchScore || 0) * 0.1;
        reason = reason || `Recomendado para ${trigger?.name || template.trigger}`;
      }

      scored.push({
        template,
        reason: reason || `Sugerido baseado no perfil ${contactDISC || 'do contato'}`,
        score,
        successData: stats || null,
        isPersonalized,
        tag,
      });
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [allTemplates, templateStats, contactDISC, analysis]);

  const handleUseTemplate = async (template: PersuasionTemplate) => {
    await createUsage({
      contact_id: contact.id,
      trigger_type: template.trigger as TriggerType,
      template_id: template.id,
      template_title: template.title,
      scenario: template.scenario as PersuasionScenario,
      channel: template.channel,
      result: 'pending',
    });
  };

  return { suggestions, loading, handleUseTemplate, contactDISC };
}
