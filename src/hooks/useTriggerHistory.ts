import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { TriggerType, PersuasionScenario } from '@/types/triggers';
import { logger } from "@/lib/logger";

export type TriggerResult = 'success' | 'neutral' | 'failure' | 'pending';

export interface TriggerUsageEntry {
  id: string;
  user_id: string;
  contact_id: string;
  trigger_type: TriggerType;
  template_id: string | null;
  template_title: string | null;
  scenario: PersuasionScenario | null;
  channel: string | null;
  context: string | null;
  result: TriggerResult;
  notes: string | null;
  effectiveness_rating: number | null;
  used_at: string;
  created_at: string;
}

export interface CreateTriggerUsageInput {
  contact_id: string;
  trigger_type: TriggerType;
  template_id?: string;
  template_title?: string;
  scenario?: PersuasionScenario;
  channel?: string;
  context?: string;
  result?: TriggerResult;
  notes?: string;
}

export interface UpdateTriggerUsageInput {
  result?: TriggerResult;
  notes?: string;
  effectiveness_rating?: number;
}

export interface TriggerStats {
  totalUsages: number;
  successRate: number;
  mostUsedTrigger: { type: TriggerType; count: number } | null;
  mostEffectiveTrigger: { type: TriggerType; avgRating: number } | null;
  byResult: Record<TriggerResult, number>;
}

export function useTriggerHistory(contactId?: string) {
  const { user } = useAuth();
  const [history, setHistory] = useState<TriggerUsageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TriggerStats | null>(null);

  const calculateStats = useCallback((entries: TriggerUsageEntry[]): TriggerStats | null => {
    if (entries.length === 0) return null;

    const byResult: Record<TriggerResult, number> = {
      success: 0,
      neutral: 0,
      failure: 0,
      pending: 0,
    };

    const triggerCounts: Record<string, number> = {};
    const triggerRatings: Record<string, { total: number; count: number }> = {};

    entries.forEach((entry) => {
      byResult[entry.result]++;
      triggerCounts[entry.trigger_type] = (triggerCounts[entry.trigger_type] || 0) + 1;

      if (entry.effectiveness_rating) {
        if (!triggerRatings[entry.trigger_type]) {
          triggerRatings[entry.trigger_type] = { total: 0, count: 0 };
        }
        triggerRatings[entry.trigger_type].total += entry.effectiveness_rating;
        triggerRatings[entry.trigger_type].count++;
      }
    });

    const completedEntries = entries.filter(e => e.result !== 'pending');
    const successRate = completedEntries.length > 0
      ? (byResult.success / completedEntries.length) * 100
      : 0;

    const mostUsedTrigger = Object.entries(triggerCounts).reduce<{ type: TriggerType; count: number } | null>(
      (max, [type, count]) => (!max || count > max.count ? { type: type as TriggerType, count } : max),
      null
    );

    const mostEffectiveTrigger = Object.entries(triggerRatings).reduce<{ type: TriggerType; avgRating: number } | null>(
      (max, [type, { total, count }]) => {
        const avg = total / count;
        return !max || avg > max.avgRating ? { type: type as TriggerType, avgRating: avg } : max;
      },
      null
    );

    return {
      totalUsages: entries.length,
      successRate,
      mostUsedTrigger,
      mostEffectiveTrigger,
      byResult,
    };
  }, []);

  const applyHistoryState = useCallback((entries: TriggerUsageEntry[]) => {
    setHistory(entries);
    setStats(calculateStats(entries));
  }, [calculateStats]);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      applyHistoryState([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('trigger_usage_history')
        .select('*')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;

      applyHistoryState((data as TriggerUsageEntry[]) || []);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching trigger history:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [user, contactId, applyHistoryState]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const createUsage = async (input: CreateTriggerUsageInput): Promise<TriggerUsageEntry | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('trigger_usage_history')
        .insert({
          user_id: user.id,
          contact_id: input.contact_id,
          trigger_type: input.trigger_type,
          template_id: input.template_id || null,
          template_title: input.template_title || null,
          scenario: input.scenario || null,
          channel: input.channel || null,
          context: input.context || null,
          result: input.result || 'pending',
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchHistory();
      return data as TriggerUsageEntry;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating trigger usage:', { error: msg });
      return null;
    }
  };

  const updateUsage = async (id: string, input: UpdateTriggerUsageInput): Promise<boolean> => {
    if (!user) return false;

    const previousHistory = history;
    const optimisticHistory = history.map(entry =>
      entry.id === id ? { ...entry, ...input } : entry
    );
    applyHistoryState(optimisticHistory);

    try {
      const { error } = await supabase
        .from('trigger_usage_history')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      applyHistoryState(previousHistory);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating trigger usage:', { error: msg });
      return false;
    }
  };

  const deleteUsage = async (id: string): Promise<boolean> => {
    if (!user) return false;

    const previousHistory = history;
    const optimisticHistory = history.filter(entry => entry.id !== id);
    applyHistoryState(optimisticHistory);

    try {
      const { error } = await supabase
        .from('trigger_usage_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return true;
    } catch (error) {
      applyHistoryState(previousHistory);
      logger.error('Error deleting trigger usage:', error);
      return false;
    }
  };

  return {
    history,
    loading,
    stats,
    createUsage,
    updateUsage,
    deleteUsage,
    refetch: fetchHistory,
  };
}
