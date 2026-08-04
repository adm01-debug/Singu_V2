import { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Zap, RefreshCw, Loader2, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useLeadScore, useLeadScoreHistory, useCalculateLeadScore, GRADE_CONFIG, type LeadGrade } from '@/hooks/useLeadScore';
import { LeadScoreBadge } from './LeadScoreBadge';

interface Props {
  contactId: string;
  contactData?: {
    relationship_score: number | null;
    interactions_count: number;
    last_interaction_days: number | null;
    has_disc: boolean;
    has_eq: boolean;
    has_vak: boolean;
    has_metaprogram: boolean;
    profile_completeness: number;
    active_deals: number;
    deal_stage_max: number;
    response_rate: number;
    rapport_score: number | null;
    churn_risk: number | null;
    hidden_objections_count: number;
    cadence_on_track: boolean;
  };
}

const DIMENSION_CONFIG = {
  engagement: { label: 'Engajamento', color: 'bg-emerald-500', icon: '📊' },
  fit: { label: 'Fit (Perfil)', color: 'bg-blue-500', icon: '🎯' },
  intent: { label: 'Intenção', color: 'bg-purple-500', icon: '💡' },
  relationship: { label: 'Relacionamento', color: 'bg-amber-500', icon: '🤝' },
} as const;

function LeadScoreCardInner({ contactId, contactData }: Props) {
  const { data: score, isLoading } = useLeadScore(contactId);
  const { data: history } = useLeadScoreHistory(contactId);
  const calculateMutation = useCalculateLeadScore();

  const handleCalculate = useCallback(() => {
    if (!contactData) return;
    calculateMutation.mutate({
      contactId,
      contactData: { id: contactId, ...contactData },
    });
  }, [contactId, contactData, calculateMutation]);

  const grade = (score?.grade as LeadGrade) ?? 'cold';
  const gradeConfig = GRADE_CONFIG[grade];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const dimensions = [
    { key: 'engagement' as const, value: Number(score?.engagement_score ?? 0) },
    { key: 'fit' as const, value: Number(score?.fit_score ?? 0) },
    { key: 'intent' as const, value: Number(score?.intent_score ?? 0) },
    { key: 'relationship' as const, value: Number(score?.relationship_score ?? 0) },
  ];

  const scoreChange = Number(score?.score_change ?? 0);
  const hasScore = !!score;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            Lead Score
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasScore && (
              <LeadScoreBadge
                score={Number(score.total_score)}
                grade={grade}
                change={scoreChange}
                size="md"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCalculate}
              disabled={calculateMutation.isPending || !contactData}
            >
              {calculateMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1">{hasScore ? 'Recalcular' : 'Calcular'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!hasScore ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Lead Score ainda não calculado para este contato.
            </p>
            <p className="text-xs text-muted-foreground">
              Clique em "Calcular" para gerar o score baseado nos dados existentes.
            </p>
          </div>
        ) : (
          <>
            {/* Score principal */}
            <div className="text-center pb-2">
              <div className="text-4xl font-bold tabular-nums">
                {Math.round(Number(score.total_score))}
              </div>
              <p className={`text-sm font-medium ${gradeConfig.color}`}>
                {gradeConfig.emoji} {gradeConfig.label}
              </p>
              {scoreChange !== 0 && (
                <p className={`text-xs flex items-center justify-center gap-1 mt-1 ${scoreChange > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {scoreChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {scoreChange > 0 ? '+' : ''}{Math.round(scoreChange)} pts
                </p>
              )}
            </div>

            {/* 4 dimensões */}
            <div className="space-y-2">
              {dimensions.map((dim) => {
                const cfg = DIMENSION_CONFIG[dim.key];
                return (
                  <div key={dim.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="font-medium tabular-nums">{Math.round(dim.value)}</span>
                    </div>
                    <Progress value={dim.value} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            {/* Fatores detalhados */}
            {Array.isArray(score.score_factors) && score.score_factors.length > 0 && (
              <div className="pt-2 border-t">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 cursor-help mb-2">
                      <Info className="h-3 w-3" />
                      {score.score_factors.length} fatores analisados
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      {score.score_factors.map((f, i) => (
                        <div key={i} className="flex justify-between gap-3">
                          <span>{f.factor}</span>
                          <span className="font-mono text-muted-foreground">{f.value}/{f.maxValue}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Mini histórico */}
            {Array.isArray(history) && history.length > 1 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1.5">Evolução recente</p>
                <div className="flex items-end gap-0.5 h-8">
                  {history.slice(-15).map((h, i) => {
                    const val = Number(h.total_score);
                    return (
                      <Tooltip key={h.id || i}>
                        <TooltipTrigger asChild>
                          <div
                            className={`flex-1 rounded-sm ${DIMENSION_CONFIG.engagement.color} opacity-60 hover:opacity-100 transition-opacity cursor-default`}
                            style={{ height: `${Math.max(4, val)}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {Math.round(val)} pts — {new Date(h.recorded_at).toLocaleDateString('pt-BR')}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const LeadScoreCard = memo(LeadScoreCardInner);
