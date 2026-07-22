// ==============================================
// NLP Evolution Timeline - Visual History of Profile Changes
// Enterprise Level Component
// ==============================================

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Ear, Hand, Brain, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VAK_LABELS, VAKType } from '@/types/vak';
import { EMOTIONAL_STATE_INFO } from '@/data/nlpAdvancedData';
import { EmotionalState } from '@/types/nlp-advanced';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { NLPEvolutionCharts } from './nlp-evolution/NLPEvolutionCharts';

interface NLPEvolutionTimelineProps {
  contactId: string;
  contactName?: string;
  className?: string;
}

type Period = '7d' | '30d' | '90d' | '180d';
type AnalysisType = 'vak' | 'emotional' | 'all';

interface VAKDataPoint {
  date: string;
  displayDate: string;
  visual: number;
  auditory: number;
  kinesthetic: number;
  digital: number;
  dominant: VAKType;
}

interface EmotionalDataPoint {
  date: string;
  displayDate: string;
  state: EmotionalState;
  confidence: number;
  stateScore: number;
}

const getEmotionalScore = (state: EmotionalState): number => {
  const positiveStates = ['excited', 'confident', 'interested', 'curious', 'hopeful'];
  const negativeStates = ['frustrated', 'anxious', 'resistant', 'skeptical', 'hesitant'];
  if (positiveStates.includes(state)) return 1;
  if (negativeStates.includes(state)) return -1;
  return 0;
};

const NLPEvolutionTimeline: React.FC<NLPEvolutionTimelineProps> = ({
  contactId, contactName, className
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [activeTab, setActiveTab] = useState<AnalysisType>('all');
  const [vakData, setVakData] = useState<VAKDataPoint[]>([]);
  const [emotionalData, setEmotionalData] = useState<EmotionalDataPoint[]>([]);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    if (!user || !contactId) return;
    const currentUser = user;
    let cancelled = false;
    const fetchEvolutionData = async () => {
      setLoading(true);
      try {
        const periodDays = { '7d': 7, '30d': 30, '90d': 90, '180d': 180 }[period];
        const startDate = subDays(new Date(), periodDays).toISOString();

        const { data: vakHistory } = await supabase
          .from('vak_analysis_history')
          .select('created_at, visual_score, auditory_score, kinesthetic_score, digital_score')
          .eq('contact_id', contactId).eq('user_id', currentUser.id)
          .gte('created_at', startDate).order('created_at', { ascending: true });

        const { data: emotionalHistory } = await supabase
          .from('emotional_states_history')
          .select('created_at, emotional_state, confidence')
          .eq('contact_id', contactId).eq('user_id', currentUser.id)
          .gte('created_at', startDate).order('created_at', { ascending: true });

        if (cancelled) return;
        const typeMap: Record<string, VAKType> = { visual: 'V', auditory: 'A', kinesthetic: 'K', digital: 'D' };

        const processedVak: VAKDataPoint[] = (vakHistory || []).map(entry => {
          const scores = { visual: entry.visual_score || 0, auditory: entry.auditory_score || 0, kinesthetic: entry.kinesthetic_score || 0, digital: entry.digital_score || 0 };
          const maxScore = Math.max(...Object.values(scores));
          // eslint-disable-next-line sonarjs/no-nested-functions -- closures legítimas para métricas/timeline; refator quebraria coesão
          const dominant = (Object.keys(scores) as Array<keyof typeof scores>).find(k => scores[k] === maxScore) || 'visual';
          return { date: entry.created_at, displayDate: format(new Date(entry.created_at), 'dd/MM', { locale: ptBR }), ...scores, dominant: typeMap[dominant] };
        });

        const processedEmotional: EmotionalDataPoint[] = (emotionalHistory || []).map(entry => ({
          date: entry.created_at, displayDate: format(new Date(entry.created_at), 'dd/MM', { locale: ptBR }),
          state: entry.emotional_state as EmotionalState, confidence: entry.confidence || 50,
          stateScore: getEmotionalScore(entry.emotional_state as EmotionalState)
        }));

        setVakData(processedVak);
        setEmotionalData(processedEmotional);
      } catch (error) {
        if (cancelled) return;
        logger.error('Error fetching evolution data:', { error: error instanceof Error ? error.message : String(error) });
        toast.error('Erro ao carregar histórico de evolução');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchEvolutionData();
    return () => { cancelled = true; };
  }, [user, contactId, period, refreshCounter]);

  const vakTrend = useMemo(() => {
    if (vakData.length < 2) return null;
    const recent = vakData.slice(-5);
    const earlier = vakData.slice(0, 5);
    const count = (arr: VAKDataPoint[]) => arr.reduce((acc, d) => { acc[d.dominant] = (acc[d.dominant] || 0) + 1; return acc; }, {} as Record<VAKType, number>);
    const getDominant = (m: Record<VAKType, number>) => Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] as VAKType;
    const current = getDominant(count(recent));
    const previous = getDominant(count(earlier));
    return { current, previous, changed: current !== previous, stability: current === previous ? 'stable' as const : 'evolving' as const };
  }, [vakData]);

  const emotionalTrend = useMemo(() => {
    if (emotionalData.length < 3) return null;
    const recent = emotionalData.slice(-3);
    const avgScore = recent.reduce((acc, d) => acc + d.stateScore, 0) / recent.length;
    return {
      trend: avgScore > 0.3 ? 'improving' as const : avgScore < -0.3 ? 'declining' as const : 'stable' as const,
      avgConfidence: Math.round(recent.reduce((acc, d) => acc + d.confidence, 0) / recent.length),
      currentState: recent[recent.length - 1]?.state || 'neutral' as EmotionalState
    };
  }, [emotionalData]);

  const radarData = useMemo(() => {
    if (vakData.length === 0) return [];
    const latest = vakData[vakData.length - 1];
    return [
      { subject: 'Visual', value: latest?.visual || 0, fullMark: 100 },
      { subject: 'Auditivo', value: latest?.auditory || 0, fullMark: 100 },
      { subject: 'Cinestésico', value: latest?.kinesthetic || 0, fullMark: 100 },
      { subject: 'Digital', value: latest?.digital || 0, fullMark: 100 }
    ];
  }, [vakData]);

  if (loading) {
    return <Card className={className}><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>;
  }

  const hasData = vakData.length > 0 || emotionalData.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Evolução do Perfil PNL</CardTitle>
            <CardDescription>{contactName ? `Histórico de ${contactName}` : 'Mudanças ao longo do tempo'}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 dias</SelectItem>
                <SelectItem value="30d">30 dias</SelectItem>
                <SelectItem value="90d">3 meses</SelectItem>
                <SelectItem value="180d">6 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" aria-label="Atualizar" onClick={() => setRefreshCounter(c => c + 1)}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum dado de evolução disponível</p>
            <p className="text-sm mt-1">Analise mais interações para ver o histórico</p>
          </div>
        ) : (
          <>
            {/* Trend Indicators */}
            <div className="grid grid-cols-2 gap-3">
              {vakTrend && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    {vakTrend.current === 'V' ? <Eye className="w-4 h-4 text-secondary" /> : vakTrend.current === 'A' ? <Ear className="w-4 h-4 text-info" /> : vakTrend.current === 'K' ? <Hand className="w-4 h-4 text-success" /> : <Brain className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm font-medium">Sistema VAK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={VAK_LABELS[vakTrend.current]?.bgColor}>{VAK_LABELS[vakTrend.current]?.name}</Badge>
                    <span className="text-xs text-muted-foreground">{vakTrend.stability === 'stable' ? '✓ Estável' : '↔ Em evolução'}</span>
                  </div>
                </motion.div>
              )}
              {emotionalTrend && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    {emotionalTrend.trend === 'improving' ? <TrendingUp className="w-4 h-4 text-success" /> : emotionalTrend.trend === 'declining' ? <TrendingDown className="w-4 h-4 text-destructive" /> : <Minus className="w-4 h-4 text-warning" />}
                    <span className="text-sm font-medium">Estado Emocional</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={EMOTIONAL_STATE_INFO[emotionalTrend.currentState]?.bgColor || 'bg-muted'}>
                      {EMOTIONAL_STATE_INFO[emotionalTrend.currentState]?.icon} {EMOTIONAL_STATE_INFO[emotionalTrend.currentState]?.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {emotionalTrend.trend === 'improving' ? '📈 Melhorando' : emotionalTrend.trend === 'declining' ? '📉 Atenção' : '➡️ Estável'}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            <NLPEvolutionCharts activeTab={activeTab} onTabChange={(v) => setActiveTab(v as AnalysisType)} vakData={vakData} emotionalData={emotionalData} radarData={radarData} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NLPEvolutionTimeline;
