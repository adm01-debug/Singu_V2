// ==============================================
// DISC Evolution Timeline - Visual History
// Enterprise Level Component
// ==============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  TrendingUp, TrendingDown, Minus, 
  Activity, Zap, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { logger } from "@/lib/logger";

interface TimelineDataPoint {
  date: string;
  formattedDate: string;
  D: number;
  I: number;
  S: number;
  C: number;
  primary: string;
  confidence: number;
  source: string;
}

interface DISCEvolutionTimelineProps {
  contactId: string;
  contactName?: string;
}

const DISC_COLORS = {
  D: 'hsl(0, 70%, 50%)',
  I: 'hsl(45, 85%, 50%)',
  S: 'hsl(145, 60%, 45%)',
  C: 'hsl(210, 70%, 50%)'
};

const DISCEvolutionTimeline: React.FC<DISCEvolutionTimelineProps> = ({ 
  contactId,
  contactName 
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSelectedPoint] = useState<TimelineDataPoint | null>(null);
  const [viewMode, setViewMode] = useState<'line' | 'area'>('area');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !contactId) return;

      setLoading(true);
      try {
        const { data: history, error } = await supabase
          .from('disc_analysis_history')
          .select('*')
          .eq('contact_id', contactId)
          .order('analyzed_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        const chartData: TimelineDataPoint[] = (history || []).map(h => ({
          date: h.analyzed_at,
          formattedDate: format(parseISO(h.analyzed_at), 'dd/MM/yy', { locale: ptBR }),
          D: h.dominance_score,
          I: h.influence_score,
          S: h.steadiness_score,
          C: h.conscientiousness_score,
          primary: h.primary_profile,
          confidence: h.confidence,
          source: h.analysis_source
        }));

        setData(chartData);
        if (chartData.length > 0) {
          setSelectedPoint(chartData[chartData.length - 1]);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erro desconhecido';
        logger.error('Error fetching DISC history:', { error: msg });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, contactId]);

  const getTrend = (dimension: 'D' | 'I' | 'S' | 'C'): 'up' | 'down' | 'stable' => {
    if (data.length < 2) return 'stable';
    const recent = data.slice(-3);
    const first = recent[0][dimension];
    const last = recent[recent.length - 1][dimension];
    const diff = last - first;
    if (Math.abs(diff) < 5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-success" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-destructive" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getEvolutionInsights = () => {
    if (data.length < 2) return [];
    
    const insights: string[] = [];
    const first = data[0];
    const last = data[data.length - 1];
    const daysDiff = differenceInDays(parseISO(last.date), parseISO(first.date));

    // Profile change detection
    if (first.primary !== last.primary) {
      insights.push(`📊 Mudança de perfil principal: ${first.primary} → ${last.primary}`);
    }

    // Dimension trends
    (['D', 'I', 'S', 'C'] as const).forEach(dim => {
      const diff = last[dim] - first[dim];
      if (Math.abs(diff) >= 15) {
        const direction = diff > 0 ? 'aumentou' : 'diminuiu';
        const profileName = DISC_PROFILES[dim]?.name || dim;
        insights.push(`${dim === 'D' ? '⚡' : dim === 'I' ? '🌟' : dim === 'S' ? '🌿' : '📐'} ${profileName} ${direction} ${Math.abs(diff).toFixed(0)} pontos`);
      }
    });

    // Confidence trend
    if (last.confidence - first.confidence >= 20) {
      insights.push(`✅ Confiança na análise melhorou significativamente`);
    }

    // Time-based insight
    if (daysDiff > 0) {
      insights.push(`📅 Evolução analisada ao longo de ${daysDiff} dias`);
    }

    return insights.slice(0, 4);
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground/70" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Sem Histórico de Evolução
          </h3>
          <p className="text-sm text-muted-foreground">
            Análises DISC aparecerão aqui conforme forem realizadas
          </p>
        </CardContent>
      </Card>
    );
  }

  const insights = getEvolutionInsights();

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">
              Evolução do Perfil DISC
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'area' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('area')}
            >
              Área
            </Button>
            <Button
              variant={viewMode === 'line' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('line')}
            >
              Linha
            </Button>
          </div>
        </div>
        {contactName && (
          <p className="text-sm text-muted-foreground">
            Histórico de {data.length} análises para {contactName}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  {(['D', 'I', 'S', 'C'] as const).map(dim => (
                    <linearGradient key={dim} id={`gradient${dim}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={DISC_COLORS[dim]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={DISC_COLORS[dim]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {(['D', 'I', 'S', 'C'] as const).map(dim => (
                  <Area
                    key={dim}
                    type="monotone"
                    dataKey={dim}
                    name={DISC_PROFILES[dim]?.name || dim}
                    stroke={DISC_COLORS[dim]}
                    fill={`url(#gradient${dim})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {(['D', 'I', 'S', 'C'] as const).map(dim => (
                  <Line
                    key={dim}
                    type="monotone"
                    dataKey={dim}
                    name={DISC_PROFILES[dim]?.name || dim}
                    stroke={DISC_COLORS[dim]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Trend Badges */}
        <div className="flex flex-wrap gap-2">
          {(['D', 'I', 'S', 'C'] as const).map(dim => {
            const trend = getTrend(dim);
            const current = data[data.length - 1]?.[dim] || 0;
            return (
              <Badge 
                key={dim}
                variant="outline"
                className="flex items-center gap-1.5 px-3 py-1"
                style={{ borderColor: DISC_COLORS[dim] }}
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: DISC_COLORS[dim] }}
                />
                <span className="font-medium">{dim}</span>
                <span className="text-muted-foreground">{current.toFixed(0)}</span>
                {getTrendIcon(trend)}
              </Badge>
            );
          })}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Insights de Evolução
            </h4>
            <ul className="space-y-1.5">
              {insights.map((insight, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-sm text-muted-foreground flex items-center gap-2"
                >
                  <ChevronRight className="w-3 h-3 text-primary" />
                  {insight}
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DISCEvolutionTimeline;
