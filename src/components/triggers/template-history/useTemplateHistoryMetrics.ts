import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTriggerHistory, TriggerUsageEntry } from '@/hooks/useTriggerHistory';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { DISCProfile } from '@/types';
import { logger } from '@/lib/logger';
import { ContactDISCInfo, ProfileMetrics, TemplateProfileMetrics } from './types';

export function useTemplateHistoryMetrics() {
  const { user } = useAuth();
  const { history, loading: historyLoading } = useTriggerHistory();
  const [contactDISCMap, setContactDISCMap] = useState<Map<string, ContactDISCInfo>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;
    async function fetchContactDISC() {
      try {
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, behavior')
          .eq('user_id', currentUser.id)
          .limit(500);

        if (cancelled) return;
        if (error) throw error;

        const discMap = new Map<string, ContactDISCInfo>();
        contacts?.forEach((contact) => {
          const behavior = contact.behavior as { disc_profile?: DISCProfile } | null;
          if (behavior?.disc_profile) {
            discMap.set(contact.id, {
              contactId: contact.id,
              contactName: `${contact.first_name} ${contact.last_name}`,
              discProfile: behavior.disc_profile,
            });
          }
        });
        setContactDISCMap(discMap);
      } catch (error) {
        if (cancelled) return;
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching contact DISC profiles:', { error: msg });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchContactDISC();
    return () => { cancelled = true; };
  }, [user]);

  const profileMetrics = useMemo(() => {
    const metrics: Record<DISCProfile, ProfileMetrics> = {
      D: { profile: 'D', totalUsages: 0, successCount: 0, successRate: 0, avgRating: 0, topTemplates: [], trend: 'stable', recentUsages: [] },
      I: { profile: 'I', totalUsages: 0, successCount: 0, successRate: 0, avgRating: 0, topTemplates: [], trend: 'stable', recentUsages: [] },
      S: { profile: 'S', totalUsages: 0, successCount: 0, successRate: 0, avgRating: 0, topTemplates: [], trend: 'stable', recentUsages: [] },
      C: { profile: 'C', totalUsages: 0, successCount: 0, successRate: 0, avgRating: 0, topTemplates: [], trend: 'stable', recentUsages: [] },
    };

    const usagesByProfile: Record<DISCProfile, TriggerUsageEntry[]> = { D: [], I: [], S: [], C: [] };
    history.forEach((entry) => {
      const contactInfo = contactDISCMap.get(entry.contact_id);
      if (contactInfo) usagesByProfile[contactInfo.discProfile].push(entry);
    });

    (['D', 'I', 'S', 'C'] as DISCProfile[]).forEach((profile) => {
      const usages = usagesByProfile[profile];
      const completedUsages = usages.filter(u => u.result !== 'pending');
      const successUsages = completedUsages.filter(u => u.result === 'success');
      const ratedUsages = usages.filter(u => u.effectiveness_rating !== null);

      metrics[profile].totalUsages = usages.length;
      metrics[profile].successCount = successUsages.length;
      metrics[profile].successRate = completedUsages.length > 0 ? (successUsages.length / completedUsages.length) * 100 : 0;
      metrics[profile].avgRating = ratedUsages.length > 0 ? ratedUsages.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / ratedUsages.length : 0;
      metrics[profile].recentUsages = usages.sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()).slice(0, 5);

      const sortedUsages = [...completedUsages].sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime());
      const recentHalf = sortedUsages.slice(0, Math.ceil(sortedUsages.length / 2));
      const olderHalf = sortedUsages.slice(Math.ceil(sortedUsages.length / 2));
      const recentSuccessRate = recentHalf.length > 0 ? (recentHalf.filter(u => u.result === 'success').length / recentHalf.length) * 100 : 0;
      const olderSuccessRate = olderHalf.length > 0 ? (olderHalf.filter(u => u.result === 'success').length / olderHalf.length) * 100 : 0;
      if (recentSuccessRate > olderSuccessRate + 10) metrics[profile].trend = 'up';
      else if (recentSuccessRate < olderSuccessRate - 10) metrics[profile].trend = 'down';

      const templateMap = new Map<string, { templateId: string; templateTitle: string; triggerType: string; usages: number; successCount: number; totalRating: number; ratedCount: number }>();
      usages.forEach((usage) => {
        const key = usage.template_id || usage.trigger_type;
        const existing = templateMap.get(key) || { templateId: usage.template_id || '', templateTitle: usage.template_title || '', triggerType: usage.trigger_type, usages: 0, successCount: 0, totalRating: 0, ratedCount: 0 };
        existing.usages++;
        if (usage.result === 'success') existing.successCount++;
        if (usage.effectiveness_rating) { existing.totalRating += usage.effectiveness_rating; existing.ratedCount++; }
        templateMap.set(key, existing);
      });

      metrics[profile].topTemplates = Array.from(templateMap.values())
        .map(t => ({ ...t, successRate: t.usages > 0 ? (t.successCount / t.usages) * 100 : 0, avgRating: t.ratedCount > 0 ? t.totalRating / t.ratedCount : 0 }))
        .sort((a, b) => b.successRate - a.successRate || b.usages - a.usages)
        .slice(0, 5);
    });

    return metrics;
  }, [history, contactDISCMap]);

  const templateMetrics = useMemo(() => {
    const templateMap = new Map<string, TemplateProfileMetrics>();
    history.forEach((entry) => {
      const contactInfo = contactDISCMap.get(entry.contact_id);
      if (!contactInfo) return;
      const key = entry.template_id || entry.trigger_type;
      const existing = templateMap.get(key) || {
        templateId: entry.template_id || '',
        templateTitle: entry.template_title || MENTAL_TRIGGERS[entry.trigger_type as keyof typeof MENTAL_TRIGGERS]?.name || entry.trigger_type,
        triggerType: entry.trigger_type,
        byProfile: {
          D: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
          I: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
          S: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
          C: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
        },
        totalUsages: 0, overallSuccessRate: 0, bestProfile: null, worstProfile: null,
      };
      existing.totalUsages++;
      const profileData = existing.byProfile[contactInfo.discProfile];
      profileData.usages++;
      if (entry.result === 'success') profileData.successCount++;
      templateMap.set(key, existing);
    });

    const result: TemplateProfileMetrics[] = [];
    templateMap.forEach((tm) => {
      let totalSuccess = 0, totalCompleted = 0, bestRate = -1, worstRate = 101;
      (['D', 'I', 'S', 'C'] as DISCProfile[]).forEach((profile) => {
        const data = tm.byProfile[profile];
        if (data.usages > 0) {
          data.successRate = (data.successCount / data.usages) * 100;
          totalSuccess += data.successCount;
          totalCompleted += data.usages;
          if (data.successRate > bestRate) { bestRate = data.successRate; tm.bestProfile = profile; }
          if (data.successRate < worstRate) { worstRate = data.successRate; tm.worstProfile = profile; }
        }
      });
      tm.overallSuccessRate = totalCompleted > 0 ? (totalSuccess / totalCompleted) * 100 : 0;
      result.push(tm);
    });
    return result.sort((a, b) => b.totalUsages - a.totalUsages);
  }, [history, contactDISCMap]);

  const isLoading = loading || historyLoading;
  const hasData = history.some(h => contactDISCMap.has(h.contact_id));

  return { profileMetrics, templateMetrics, isLoading, hasData };
}
