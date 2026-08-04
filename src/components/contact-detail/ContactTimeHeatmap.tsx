import React, { useMemo } from 'react';
import { Clock, Trophy, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useContactTimeAnalysis } from '@/hooks/useContactTimeAnalysis';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS_DISPLAY = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

function getIntensityClass(rate: number, hasData: boolean): string {
  if (!hasData) return 'bg-muted/30';
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= 60) return 'bg-emerald-400/80';
  if (rate >= 40) return 'bg-primary/60';
  if (rate >= 20) return 'bg-accent/50';
  return 'bg-destructive/40';
}

function formatHour(h: number): string {
  return `${h.toString().padStart(2, '0')}h`;
}

interface Props {
  contactId: string;
}

export function ContactTimeHeatmap({ contactId }: Props) {
  const { heatmapData, bestTimes, timeData, loading } = useContactTimeAnalysis(contactId);

  const totalAttempts = useMemo(
    () => timeData.reduce((sum, t) => sum + (t.total_attempts ?? 0), 0),
    [timeData]
  );

  const avgSuccessRate = useMemo(() => {
    const withData = timeData.filter((t) => (t.total_attempts ?? 0) > 0);
    if (withData.length === 0) return 0;
    const totalSuccess = withData.reduce((s, t) => s + (t.success_count ?? 0), 0);
    const totalAtt = withData.reduce((s, t) => s + (t.total_attempts ?? 0), 0);
    return totalAtt > 0 ? Math.round((totalSuccess / totalAtt) * 100) : 0;
  }, [timeData]);

  if (loading) return <Skeleton className="h-64 rounded-lg" />;

  if (totalAttempts === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Mapa de Melhor Horário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InlineEmptyState
            icon={Clock}
            title="Sem dados de horário"
            description="Registre interações para gerar o mapa de melhor horário"
          />
        </CardContent>
      </Card>
    );
  }

  const best = bestTimes[0] ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Mapa de Melhor Horário
          <Badge variant="outline" className="text-[10px] ml-auto">
            {totalAttempts} tentativas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="flex flex-wrap gap-2">
          {best && (
            <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30 gap-1">
              <Trophy className="h-3 w-3" />
              Melhor: {best.dayLabel} {best.hourLabel} ({Math.round(best.successRate)}%)
            </Badge>
          )}
          <Badge variant="outline" className="text-xs gap-1">
            <TrendingUp className="h-3 w-3" />
            Média: {avgSuccessRate}%
          </Badge>
        </div>

        {/* Heatmap */}
        <TooltipProvider delayDuration={100}>
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Hour headers */}
              <div className="flex gap-[2px] ml-9 mb-1">
                {HOURS_DISPLAY.map((h) => (
                  <div key={h} className="flex-1 text-[9px] text-muted-foreground text-center">
                    {h % 2 === 0 ? formatHour(h) : ''}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {heatmapData.map((row, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-[2px] mb-[2px]">
                  <span className="text-[10px] text-muted-foreground w-8 text-right pr-1">{row.day}</span>
                  {HOURS_DISPLAY.map((hour) => {
                    const cell = row.hours[hour];
                    const rate = cell?.successRate ?? 0;
                    const hasData = (cell?.attempts ?? 0) > 0;
                    const isBest = best?.dayOfWeek === dayIdx && best?.hourOfDay === hour;

                    return (
                      <Tooltip key={hour}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'flex-1 h-5 rounded-sm transition-colors cursor-default',
                              getIntensityClass(rate, hasData),
                              isBest && 'ring-1 ring-emerald-400'
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{DAYS[dayIdx]} {formatHour(hour)}</p>
                          {hasData ? (
                            <>
                              <p>Taxa de sucesso: {Math.round(rate)}%</p>
                              <p>Tentativas: {cell.attempts}</p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">Sem dados</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-2 mt-2 ml-9">
                <span className="text-[9px] text-muted-foreground">Pior</span>
                <div className="flex gap-[2px]">
                  {['bg-destructive/40', 'bg-accent/50', 'bg-primary/60', 'bg-emerald-400/80', 'bg-emerald-500'].map((c) => (
                    <div key={c} className={cn('w-4 h-3 rounded-sm', c)} />
                  ))}
                </div>
                <span className="text-[9px] text-muted-foreground">Melhor</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
