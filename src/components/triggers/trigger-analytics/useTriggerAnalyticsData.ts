import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MENTAL_TRIGGERS, TriggerType } from '@/types/triggers';
import { logger } from '@/lib/logger';
import type { DISCProfile, TriggerUsageWithContact, TriggerEffectiveness } from './types';

export function useTriggerAnalyticsData(periodFilter: '30d' | '90d' | '365d' | 'all') {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<TriggerUsageWithContact[]>([]);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        let dateFilter = '';
        const now = new Date();
        if (periodFilter !== 'all') {
          const days = periodFilter === '30d' ? 30 : periodFilter === '90d' ? 90 : 365;
          const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          dateFilter = startDate.toISOString();
        }

        let query = supabase
          .from('trigger_usage_history')
          .select('id, trigger_type, result, effectiveness_rating, used_at, contact_id')
          .eq('user_id', currentUser.id)
          .order('used_at', { ascending: false });

        if (dateFilter) query = query.gte('used_at', dateFilter);

        const { data: usageHistory, error: usageError } = await query;
        if (usageError) throw usageError;

        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, behavior')
          .eq('user_id', currentUser.id);
        if (contactsError) throw contactsError;

        const contactDISCMap = new Map<string, DISCProfile | null>();
        contacts?.forEach((contact) => {
          const behavior = contact.behavior as { discProfile?: string } | null;
          contactDISCMap.set(contact.id, (behavior?.discProfile as DISCProfile) || null);
        });

        if (cancelled) return;
        setUsageData((usageHistory || []).map((usage) => ({
          id: usage.id,
          trigger_type: usage.trigger_type,
          result: usage.result || 'pending',
          effectiveness_rating: usage.effectiveness_rating,
          used_at: usage.used_at,
          contact_disc: contactDISCMap.get(usage.contact_id) || null,
        })));
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching analytics data:', { error: msg });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [user, periodFilter]);

  const stats = useMemo(() => {
    if (usageData.length === 0) return null;

    const completedUsages = usageData.filter(u => u.result !== 'pending');
    const successCount = usageData.filter(u => u.result === 'success').length;
    const ratedUsages = usageData.filter(u => u.effectiveness_rating !== null);
    const avgRating = ratedUsages.length > 0
      ? ratedUsages.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / ratedUsages.length
      : 0;

    const byDISC: Record<DISCProfile, { discProfile: DISCProfile; totalUsages: number; successRate: number; avgRating: number; topTriggers: Array<{ type: TriggerType; count: number; successRate: number; avgRating: number }> }> = {
      D: { discProfile: 'D', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      I: { discProfile: 'I', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      S: { discProfile: 'S', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      C: { discProfile: 'C', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
    };

    const discGroups: Record<DISCProfile, TriggerUsageWithContact[]> = { D: [], I: [], S: [], C: [] };
    usageData.forEach((u) => {
      if (u.contact_disc && discGroups[u.contact_disc]) discGroups[u.contact_disc].push(u);
    });

    Object.entries(discGroups).forEach(([disc, usages]) => {
      const d = disc as DISCProfile;
      const completed = usages.filter(u => u.result !== 'pending');
      const success = usages.filter(u => u.result === 'success').length;
      const rated = usages.filter(u => u.effectiveness_rating !== null);

      byDISC[d].totalUsages = usages.length;
      byDISC[d].successRate = completed.length > 0 ? (success / completed.length) * 100 : 0;
      byDISC[d].avgRating = rated.length > 0
        ? (rated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / rated.length) * 20
        : 0;

      const triggerCounts: Record<string, { count: number; success: number; totalRating: number; ratedCount: number }> = {};
      usages.forEach((u) => {
        if (!triggerCounts[u.trigger_type]) triggerCounts[u.trigger_type] = { count: 0, success: 0, totalRating: 0, ratedCount: 0 };
        triggerCounts[u.trigger_type].count++;
        if (u.result === 'success') triggerCounts[u.trigger_type].success++;
        if (u.effectiveness_rating !== null) {
          triggerCounts[u.trigger_type].totalRating += u.effectiveness_rating;
          triggerCounts[u.trigger_type].ratedCount++;
        }
      });

      byDISC[d].topTriggers = Object.entries(triggerCounts)
        .map(([type, data]) => ({
          type: type as TriggerType,
          count: data.count,
          successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
          avgRating: data.ratedCount > 0 ? (data.totalRating / data.ratedCount) * 20 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    });

    const triggerStats: Record<string, TriggerEffectiveness> = {};
    usageData.forEach((u) => {
      if (!triggerStats[u.trigger_type]) {
        triggerStats[u.trigger_type] = {
          triggerType: u.trigger_type as TriggerType,
          totalUsages: 0, successRate: 0, avgRating: 0,
          byDISC: {
            D: { usages: 0, successRate: 0, avgRating: 0 },
            I: { usages: 0, successRate: 0, avgRating: 0 },
            S: { usages: 0, successRate: 0, avgRating: 0 },
            C: { usages: 0, successRate: 0, avgRating: 0 },
          },
        };
      }
      triggerStats[u.trigger_type].totalUsages++;
      if (u.contact_disc) triggerStats[u.trigger_type].byDISC[u.contact_disc].usages++;
    });

    Object.values(triggerStats).forEach((stat) => {
      const usages = usageData.filter(u => u.trigger_type === stat.triggerType);
      const completed = usages.filter(u => u.result !== 'pending');
      const success = usages.filter(u => u.result === 'success').length;
      const rated = usages.filter(u => u.effectiveness_rating !== null);

      stat.successRate = completed.length > 0 ? (success / completed.length) * 100 : 0;
      stat.avgRating = rated.length > 0
        ? (rated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / rated.length) * 20
        : 0;

      (['D', 'I', 'S', 'C'] as DISCProfile[]).forEach((disc) => {

        const discUsages = usages.filter(u => u.contact_disc === disc);

        const discCompleted = discUsages.filter(u => u.result !== 'pending');

        const discSuccess = discUsages.filter(u => u.result === 'success').length;

        const discRated = discUsages.filter(u => u.effectiveness_rating !== null);

        stat.byDISC[disc].successRate = discCompleted.length > 0 ? (discSuccess / discCompleted.length) * 100 : 0;
        stat.byDISC[disc].avgRating = discRated.length > 0

          ? (discRated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / discRated.length) * 20
          : 0;
      });
    });

    const resultDist = {
      success: usageData.filter(u => u.result === 'success').length,
      neutral: usageData.filter(u => u.result === 'neutral').length,
      failure: usageData.filter(u => u.result === 'failure').length,
      pending: usageData.filter(u => u.result === 'pending').length,
    };

    return {
      totalUsages: usageData.length,
      successRate: completedUsages.length > 0 ? (successCount / completedUsages.length) * 100 : 0,
      avgRating,
      byDISC,
      triggerStats: Object.values(triggerStats).sort((a, b) => b.totalUsages - a.totalUsages),
      resultDist,
    };
  }, [usageData]);

  const discChartData = useMemo(() => {
    if (!stats) return [];
    return Object.values(stats.byDISC).map((d) => ({
      name: ({ D: 'Dominante', I: 'Influente', S: 'Estável', C: 'Conforme' })[d.discProfile],
      profile: d.discProfile,
      usages: d.totalUsages,
      successRate: d.successRate,
      rating: d.avgRating,
    }));
  }, [stats]);

  const resultPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Sucesso', value: stats.resultDist.success, color: 'hsl(142, 76%, 36%)' },
      { name: 'Neutro', value: stats.resultDist.neutral, color: 'hsl(215, 16%, 47%)' },
      { name: 'Falha', value: stats.resultDist.failure, color: 'hsl(0, 84%, 60%)' },
      { name: 'Pendente', value: stats.resultDist.pending, color: 'hsl(45, 93%, 47%)' },
    ].filter(d => d.value > 0);
  }, [stats]);

  const radarData = useMemo(() => {
    if (!stats) return [];
    return stats.triggerStats.slice(0, 6).map((t) => {
      const trigger = MENTAL_TRIGGERS[t.triggerType];
      return {
        trigger: trigger?.name || t.triggerType,
        D: t.byDISC.D.successRate,
        I: t.byDISC.I.successRate,
        S: t.byDISC.S.successRate,
        C: t.byDISC.C.successRate,
      };
    });
  }, [stats]);

  return { loading, stats, usageData, discChartData, resultPieData, radarData };
}
