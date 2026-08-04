import { useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus, Heart, Shield, Zap, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLeadScore } from '@/hooks/useLeadScore';
import { useLocalChurnRisks } from '@/hooks/useChurnRisk';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
  sentiment?: string | null;
  relationshipScore?: number | null;
  interactionCount?: number;
}

interface Dimension {
  key: string;
  label: string;
  score: number;      // 0-100
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  detail: string;
}

function getOverallHealth(dimensions: Dimension[]): { score: number; label: string; color: string } {
  const avg = dimensions.reduce((s, d) => s + d.score, 0) / (dimensions.length || 1);
  if (avg >= 70) return { score: Math.round(avg), label: 'Saudável', color: 'text-emerald-500' };
  if (avg >= 40) return { score: Math.round(avg), label: 'Atenção', color: 'text-warning' };
  return { score: Math.round(avg), label: 'Crítico', color: 'text-destructive' };
}

function sentimentToScore(sentiment?: string | null): number {
  if (!sentiment) return 50;
  const map: Record<string, number> = {
    very_positive: 95, positive: 80, neutral: 55, negative: 25, very_negative: 10,
    positivo: 80, neutro: 55, negativo: 25,
  };
  return map[sentiment.toLowerCase()] ?? 50;
}

function sentimentLabel(sentiment?: string | null): string {
  if (!sentiment) return 'Sem dados';
  const map: Record<string, string> = {
    very_positive: 'Muito positivo', positive: 'Positivo', neutral: 'Neutro',
    negative: 'Negativo', very_negative: 'Muito negativo',
    positivo: 'Positivo', neutro: 'Neutro', negativo: 'Negativo',
  };
  return map[sentiment.toLowerCase()] ?? sentiment;
}

function churnRiskToScore(riskScore?: number): number {
  if (riskScore == null) return 70; // no data = assume ok
  return Math.max(0, 100 - riskScore);
}

export function ConsolidatedHealthPanel({ contactId, sentiment, relationshipScore, interactionCount = 0 }: Props) {
  const { data: leadScore, isLoading: lsLoading } = useLeadScore(contactId);
  const { data: churnData, isLoading: crLoading } = useLocalChurnRisks(contactId);

  const loading = lsLoading || crLoading;

  const dimensions = useMemo<Dimension[]>(() => {
    const churn = churnData?.[0];
    const ls = leadScore;

    const leadScoreVal = ls?.total_score ?? 0;
    const sentimentVal = sentimentToScore(sentiment);
    const churnVal = churnRiskToScore(churn?.risk_score);
    const relScore = relationshipScore ?? 0;

    const toStatus = (v: number): 'good' | 'warning' | 'critical' =>
      v >= 70 ? 'good' : v >= 40 ? 'warning' : 'critical';

    return [
      {
        key: 'lead',
        label: 'Lead Score',
        score: leadScoreVal,
        status: toStatus(leadScoreVal),
        icon: <Zap className="h-3.5 w-3.5" />,
        detail: ls ? `${ls.score_change > 0 ? '+' : ''}${ls.score_change} pts` : 'Sem dados',
      },
      {
        key: 'churn',
        label: 'Saúde (Anti-Churn)',
        score: churnVal,
        status: toStatus(churnVal),
        icon: <Shield className="h-3.5 w-3.5" />,
        detail: churn ? `Risco: ${churn.risk_level}` : 'Sem análise',
      },
      {
        key: 'sentiment',
        label: 'Sentimento',
        score: sentimentVal,
        status: toStatus(sentimentVal),
        icon: <Heart className="h-3.5 w-3.5" />,
        detail: sentimentLabel(sentiment),
      },
      {
        key: 'relationship',
        label: 'Relacionamento',
        score: relScore,
        status: toStatus(relScore),
        icon: <MessageSquare className="h-3.5 w-3.5" />,
        detail: `${interactionCount} interações`,
      },
    ];
  }, [leadScore, churnData, sentiment, relationshipScore, interactionCount]);

  const health = useMemo(() => getOverallHealth(dimensions), [dimensions]);

  if (loading) return <Skeleton className="h-40 rounded-lg" />;

  const TrendIcon = health.score >= 70 ? TrendingUp : health.score >= 40 ? Minus : TrendingDown;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-primary" />
          Saúde do Contato
          <Badge variant="outline" className={cn('ml-auto text-[10px]', health.color)}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {health.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overall score ring */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-16 h-16">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                className="stroke-muted"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                className={cn(
                  health.score >= 70 ? 'stroke-emerald-500' :
                  health.score >= 40 ? 'stroke-warning' : 'stroke-destructive'
                )}
                strokeWidth="3"
                strokeDasharray={`${health.score}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <span className={cn('absolute text-lg font-bold', health.color)}>
              {health.score}
            </span>
          </div>
          <div className="flex-1 text-xs text-muted-foreground">
            Índice geral de saúde baseado em lead score, risco de churn, sentimento e relacionamento.
          </div>
        </div>

        {/* Dimension bars */}
        <TooltipProvider delayDuration={100}>
          <div className="space-y-2">
            {dimensions.map((dim) => (
              <Tooltip key={dim.key}>
                <TooltipTrigger asChild>
                  <div className="space-y-0.5 cursor-default">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        {dim.icon}
                        {dim.label}
                      </span>
                      <span className={cn('font-medium',
                        dim.status === 'good' ? 'text-emerald-500' :
                        dim.status === 'warning' ? 'text-warning' : 'text-destructive'
                      )}>
                        {dim.score}
                      </span>
                    </div>
                    <Progress
                      value={dim.score}
                      className="h-1.5"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <p className="font-medium">{dim.label}</p>
                  <p>{dim.detail}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
