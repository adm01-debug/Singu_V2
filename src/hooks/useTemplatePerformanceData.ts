import { useMemo } from 'react';
import { Contact, DISCProfile } from '@/types';
import { PersuasionTemplate, PersuasionScenario } from '@/types/triggers';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { useTriggerHistory, TriggerUsageEntry } from '@/hooks/useTriggerHistory';

export interface TemplatePerformanceData {
  template: PersuasionTemplate;
  totalUsages: number;
  successCount: number;
  neutralCount: number;
  failureCount: number;
  successRate: number;
  avgRating: number;
  lastUsed: string | null;
  discPerformance: Record<DISCProfile, { usages: number; successRate: number }>;
  trend: 'up' | 'down' | 'stable';
}

export function useTemplatePerformanceData(
  contact: Contact | undefined,
  selectedScenario: PersuasionScenario | 'all',
  sortBy: 'successRate' | 'usages' | 'avgRating'
) {
  const { allTemplates } = useClientTriggers(contact);
  const { history } = useTriggerHistory();

  const performanceData = useMemo(() => {
    const templateUsageMap = new Map<string, TriggerUsageEntry[]>();
    history.forEach(entry => {
      if (entry.template_id) {
        const existing = templateUsageMap.get(entry.template_id) || [];
        existing.push(entry);
        templateUsageMap.set(entry.template_id, existing);
      }
    });

    const filteredTemplates = selectedScenario === 'all'
      ? allTemplates
      : allTemplates.filter(t => t.scenario === selectedScenario);

    const data: TemplatePerformanceData[] = filteredTemplates.map(template => {
      const usages = templateUsageMap.get(template.id) || [];
      const completedUsages = usages.filter(u => u.result !== 'pending');
      const successCount = completedUsages.filter(u => u.result === 'success').length;
      const neutralCount = completedUsages.filter(u => u.result === 'neutral').length;
      const failureCount = completedUsages.filter(u => u.result === 'failure').length;
      const successRate = completedUsages.length > 0 ? (successCount / completedUsages.length) * 100 : 0;

      const ratedUsages = usages.filter(u => u.effectiveness_rating !== null);
      const avgRating = ratedUsages.length > 0
        ? ratedUsages.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / ratedUsages.length
        : 0;

      const lastUsed = usages.length > 0
        ? usages.sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime())[0].used_at
        : null;

      const discPerformance = (['D', 'I', 'S', 'C'] as DISCProfile[]).reduce((acc, disc) => {
        const discUsages = completedUsages;
        // eslint-disable-next-line sonarjs/no-nested-functions
        const discSuccess = discUsages.filter(u => u.result === 'success').length;
        acc[disc] = { usages: discUsages.length, successRate: discUsages.length > 0 ? (discSuccess / discUsages.length) * 100 : 0 };
        return acc;
      }, {} as Record<DISCProfile, { usages: number; successRate: number }>);

      const sortedUsages = [...completedUsages].sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime());
      const recentUsages = sortedUsages.slice(0, Math.ceil(sortedUsages.length / 2));
      const olderUsages = sortedUsages.slice(Math.ceil(sortedUsages.length / 2));
      const recentSuccessRate = recentUsages.length > 0 ? (recentUsages.filter(u => u.result === 'success').length / recentUsages.length) * 100 : 0;
      const olderSuccessRate = olderUsages.length > 0 ? (olderUsages.filter(u => u.result === 'success').length / olderUsages.length) * 100 : 0;
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentSuccessRate > olderSuccessRate + 10) trend = 'up';
      else if (recentSuccessRate < olderSuccessRate - 10) trend = 'down';

      return { template, totalUsages: usages.length, successCount, neutralCount, failureCount, successRate, avgRating, lastUsed, discPerformance, trend };
    });

    return data.sort((a, b) => {
      if (sortBy === 'successRate') return b.successRate - a.successRate;
      if (sortBy === 'usages') return b.totalUsages - a.totalUsages;
      return b.avgRating - a.avgRating;
    });
  }, [allTemplates, history, selectedScenario, sortBy]);

  const topPerformer = performanceData.find(p => p.totalUsages >= 3 && p.successRate > 0);
  const availableScenarios = useMemo(() => {
    const scenarios = new Set<PersuasionScenario>();
    allTemplates.forEach(t => { if (t.scenario) scenarios.add(t.scenario); });
    return Array.from(scenarios);
  }, [allTemplates]);

  return { performanceData, topPerformer, availableScenarios };
}
