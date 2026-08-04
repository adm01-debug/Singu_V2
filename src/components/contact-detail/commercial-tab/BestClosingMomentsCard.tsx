import { Clock, TrendingUp, AlertTriangle, CheckCircle2, Calendar, Target, MessageSquare, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useBestClosingMoments } from '@/hooks/useBestClosingMoments';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  optimal: { label: 'Momento Ideal', color: 'text-success', icon: CheckCircle2 },
  good: { label: 'Bom Momento', color: 'text-primary', icon: TrendingUp },
  neutral: { label: 'Neutro', color: 'text-muted-foreground', icon: Clock },
  poor: { label: 'Momento Ruim', color: 'text-warning', icon: AlertTriangle },
  critical: { label: 'Evitar Agora', color: 'text-destructive', icon: XCircle },
};

export function BestClosingMomentsCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useBestClosingMoments(contactId);

  const icon = <Target className="h-4 w-4 text-primary" />;

  return (
    <ExternalDataCard
      title="Melhor Momento para Fechar"
      icon={icon}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      emptyMessage="Dados insuficientes para análise de timing"
      onRetry={refetch}
    >
      {data && (() => {
        const status = STATUS_CONFIG[data.timing_status || 'neutral'] || STATUS_CONFIG.neutral;
        const StatusIcon = status.icon;

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {icon}
                Melhor Momento para Fechar
              </CardTitle>
              <CardDescription className="text-xs">Análise de timing baseada em sinais comportamentais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <StatusIcon className={cn('h-4 w-4', status.color)} />
                  <span className={cn('text-sm font-medium', status.color)}>{status.label}</span>
                </div>
                {data.timing_score != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <Progress value={data.timing_score} className="w-20 h-2" />
                    <span className="text-xs font-medium">{data.timing_score}%</span>
                  </div>
                )}
              </div>

              {data.recommended_timing && (
                <div className="rounded-lg border bg-muted/30 p-2.5">
                  <p className="text-xs font-medium text-foreground">{data.recommended_timing}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {data.emotional_readiness && (
                  <div className="rounded-lg border p-2">
                    <p className="text-[10px] text-muted-foreground">Prontidão Emocional</p>
                    <p className="text-xs font-medium capitalize">{data.emotional_readiness}</p>
                  </div>
                )}
                {data.engagement_level && (
                  <div className="rounded-lg border p-2">
                    <p className="text-[10px] text-muted-foreground">Engajamento</p>
                    <p className="text-xs font-medium capitalize">{data.engagement_level}</p>
                  </div>
                )}
              </div>

              {(data.best_days?.length || data.best_time_ranges?.length) && (
                <div className="space-y-1">
                  {data.best_days && data.best_days.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {data.best_days.map(d => (
                        <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                      ))}
                    </div>
                  )}
                  {data.best_time_ranges && data.best_time_ranges.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {data.best_time_ranges.map(t => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {data.positive_signals && data.positive_signals.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-success flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Sinais Positivos
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {data.positive_signals.slice(0, 4).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-success/30 text-success">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.warning_signals && data.warning_signals.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-warning flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Sinais de Alerta
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {data.warning_signals.slice(0, 4).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] border-warning/30 text-warning">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {data.recommended_approach && (
                <div className="rounded-lg border bg-primary/5 p-2.5">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Abordagem Recomendada</p>
                  <p className="text-xs text-foreground">{data.recommended_approach}</p>
                </div>
              )}

              {data.key_talking_points && data.key_talking_points.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Pontos-chave
                  </p>
                  <ul className="space-y-0.5">
                    {data.key_talking_points.slice(0, 5).map((p, i) => (
                      <li key={i} className="text-[10px] text-muted-foreground pl-2 border-l-2 border-primary/20">{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.risk_of_losing && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Risco de perder</span>
                  <Badge variant={data.risk_of_losing === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {data.risk_of_losing === 'high' ? 'Alto' : data.risk_of_losing === 'medium' ? 'Médio' : 'Baixo'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </ExternalDataCard>
  );
}
