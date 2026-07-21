import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export type PeriodFilter = '7d' | '30d' | '90d' | '365d';

export interface NLPStats {
  totalAnalyses: number;
  emotionalStates: { state: string; count: number; avgConfidence: number }[];
  vakDistribution: { visual: number; auditory: number; kinesthetic: number; digital: number };
  discDistribution: { D: number; I: number; S: number; C: number };
  topValues: { name: string; count: number; avgImportance: number }[];
  objectionTypes: { type: string; count: number; resolved: number }[];
  emotionalTrend: { date: string; positive: number; neutral: number; negative: number }[];
}

const POSITIVE = ['Entusiasmo', 'Confiança', 'Interesse', 'Satisfação'];
const NEGATIVE = ['Frustração', 'Ansiedade'];

const EMPTY: NLPStats = {
  totalAnalyses: 0, emotionalStates: [], vakDistribution: { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 },
  discDistribution: { D: 0, I: 0, S: 0, C: 0 }, topValues: [], objectionTypes: [], emotionalTrend: [],
};

const getPeriodDays = (p: PeriodFilter) => ({ '7d': 7, '30d': 30, '90d': 90, '365d': 365 })[p];

function classify(emotions: { emotional_state: string }[]) {
  const pos = emotions.filter(e => POSITIVE.includes(e.emotional_state)).length;
  const neg = emotions.filter(e => NEGATIVE.includes(e.emotional_state)).length;
  return { positive: pos, neutral: Math.max(0, emotions.length - pos - neg), negative: neg };
}

function buildTrend(data: { created_at: string; emotional_state: string }[] | null, period: PeriodFilter) {
  const days = getPeriodDays(period);
  const now = new Date();
  const items = data || [];

  if (days <= 7) {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const { positive, neutral, negative } = classify(items.filter(e => e.created_at.startsWith(ds)));
      return { date: d.toLocaleDateString('pt-BR', { weekday: 'short' }), positive, neutral, negative };
    });
  }
  if (days <= 30) {
    return Array.from({ length: 4 }, (_, i) => {
      const w = 3 - i;
      const s = new Date(now); s.setDate(s.getDate() - (w * 7 + 6));
      const e = new Date(now); e.setDate(e.getDate() - (w * 7));
      const { positive, neutral, negative } = classify(items.filter(x => { const d = new Date(x.created_at); return d >= s && d <= e; }));
      return { date: `Sem ${i + 1}`, positive, neutral, negative };
    });
  }
  const months = days <= 90 ? 3 : 12;
  return Array.from({ length: months }, (_, i) => {
    const m = months - 1 - i;
    const ms = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const me = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
    const { positive, neutral, negative } = classify(items.filter(x => { const d = new Date(x.created_at); return d >= ms && d <= me; }));
    return { date: ms.toLocaleDateString('pt-BR', { month: 'short' }), positive, neutral, negative };
  });
}

export function useNLPAnalyticsData() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>('30d');

  const dateFilter = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - getPeriodDays(period));
    return d.toISOString();
  }, [period]);

  const { data: stats = EMPTY, isLoading: loading, refetch: refresh } = useQuery({
    queryKey: ['nlp-analytics', period, user?.id],
    queryFn: async () => {
      try {
        const [emRes, vakRes, cRes, vRes, oRes] = await Promise.all([
          supabase.from('emotional_states_history').select('emotional_state, confidence, created_at').eq('user_id', user!.id).gte('created_at', dateFilter).limit(500),
          supabase.from('vak_analysis_history').select('visual_score, auditory_score, kinesthetic_score, digital_score').eq('user_id', user!.id).gte('created_at', dateFilter).limit(500),
          supabase.from('contacts').select('behavior').eq('user_id', user!.id).limit(500),
          supabase.from('client_values').select('value_name, importance').eq('user_id', user!.id).gte('created_at', dateFilter).limit(500),
          supabase.from('hidden_objections').select('objection_type, resolved').eq('user_id', user!.id).gte('created_at', dateFilter).limit(500),
        ]);

        if (emRes.error) throw emRes.error;
        if (vakRes.error) throw vakRes.error;
        if (cRes.error) throw cRes.error;
        if (vRes.error) throw vRes.error;
        if (oRes.error) throw oRes.error;

        const emotionalData = emRes.data;
        const vakData = vakRes.data;

        const emMap = new Map<string, { count: number; tc: number }>();
        emotionalData?.forEach(e => {
          const c = emMap.get(e.emotional_state) || { count: 0, tc: 0 };
          emMap.set(e.emotional_state, { count: c.count + 1, tc: c.tc + (e.confidence || 0) });
        });
        const emotionalStates = Array.from(emMap.entries())
          .map(([state, d]) => ({ state, count: d.count, avgConfidence: Math.round(d.tc / d.count) }))
          .sort((a, b) => b.count - a.count);

        const vt = { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 };
        vakData?.forEach(v => { 
          vt.visual += v.visual_score || 0; 
          vt.auditory += v.auditory_score || 0; 
          vt.kinesthetic += v.kinesthetic_score || 0; 
          vt.digital += v.digital_score || 0; 
        });
        const vc = vakData?.length || 1;
        const vakDistribution = { 
          visual: Math.round(vt.visual / vc), 
          auditory: Math.round(vt.auditory / vc), 
          kinesthetic: Math.round(vt.kinesthetic / vc), 
          digital: Math.round(vt.digital / vc) 
        };

        const disc = { D: 0, I: 0, S: 0, C: 0 };
        cRes.data?.forEach(c => {
          const b = c.behavior as { disc_profile?: string } | null;
          const p = b?.disc_profile?.toUpperCase();
          if (p && p in disc) disc[p as keyof typeof disc]++;
        });

        const vm = new Map<string, { count: number; ti: number }>();
        vRes.data?.forEach(v => { 
          const c = vm.get(v.value_name) || { count: 0, ti: 0 }; 
          vm.set(v.value_name, { count: c.count + 1, ti: c.ti + (v.importance || 0) }); 
        });
        const topValues = Array.from(vm.entries()).map(([name, d]) => ({ name, count: d.count, avgImportance: Math.round(d.ti / d.count) })).sort((a, b) => b.count - a.count).slice(0, 8);

        const om = new Map<string, { count: number; resolved: number }>();
        oRes.data?.forEach(o => { 
          const c = om.get(o.objection_type) || { count: 0, resolved: 0 }; 
          om.set(o.objection_type, { count: c.count + 1, resolved: c.resolved + (o.resolved ? 1 : 0) }); 
        });
        const objectionTypes = Array.from(om.entries()).map(([type, d]) => ({ type, ...d })).sort((a, b) => b.count - a.count);

        const emotionalTrend = buildTrend(emotionalData, period);
        const totalAnalyses = (emotionalData?.length || 0) + (vakData?.length || 0) + (vRes.data?.length || 0) + (oRes.data?.length || 0);

        return { totalAnalyses, emotionalStates, vakDistribution, discDistribution: disc, topValues, objectionTypes, emotionalTrend } as NLPStats;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching NLP stats:', { error: msg });
        return EMPTY;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { stats, loading, period, setPeriod, refresh: () => { refresh(); } };
}
