import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Trophy, AlertCircle } from 'lucide-react';
import { useBestTimeHeatmap, HEATMAP_CONSTANTS } from '@/hooks/useBestTimeHeatmap';
import { cn } from '@/lib/utils';

const { DAY_LABELS, HOUR_START, HOUR_END } = HEATMAP_CONSTANTS;

function rateColor(rate: number, attempts: number): string {
  if (attempts === 0) return 'bg-muted/30';
  if (rate >= 0.6) return 'bg-success/80 text-success-foreground';
  if (rate >= 0.4) return 'bg-success/55 text-success-foreground';
  if (rate >= 0.25) return 'bg-warning/55 text-warning-foreground';
  if (rate >= 0.1) return 'bg-warning/35';
  return 'bg-destructive/40';
}

const MEDAL_LABEL = ['Melhor', '2º', '3º'];

export function BestTimeHeatmapCard() {
  const { data, loading } = useBestTimeHeatmap();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" /> Melhor Hora para Prospectar
          </CardTitle>
          <CardDescription>Análise dos últimos 90 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.hasEnoughData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" /> Melhor Hora para Prospectar
          </CardTitle>
          <CardDescription>Análise dos últimos 90 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 opacity-50" />
            <p className="text-sm">Dados insuficientes</p>
            <p className="text-xs">Mínimo de 20 interações outbound nos últimos 90 dias ({data?.totalAttempts || 0} atual)</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
  const idx = (d: number, h: number) => d * hours.length + (h - HOUR_START);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-primary" /> Melhor Hora para Prospectar
            </CardTitle>
            <CardDescription>
              {data.totalResponses} respostas em {data.totalAttempts} tentativas (últimos 90 dias)
            </CardDescription>
          </div>
        </div>
        {data.topSlots.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {data.topSlots.map((slot, i) => (
              <Badge
                key={`${slot.dayOfWeek}-${slot.hour}`}
                variant="secondary"
                className="gap-1.5 py-1"
              >
                <Trophy className={cn('w-3 h-3', i === 0 ? 'text-warning' : 'text-muted-foreground')} />
                <span className="font-medium">{MEDAL_LABEL[i]}: {slot.dayLabel} {slot.hourLabel}</span>
                <span className="text-success font-semibold">{Math.round(slot.responseRate * 100)}%</span>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex">
              <div className="w-10 shrink-0" />
              {hours.map(h => (
                <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums">
                  {h}
                </div>
              ))}
            </div>
            {DAY_LABELS.map((day, d) => (
              <div key={day} className="flex items-center mt-1">
                <div className="w-10 shrink-0 text-xs text-muted-foreground font-medium">{day}</div>
                {hours.map(h => {
                  const cell = data.cells[idx(d, h)];
                  const pct = Math.round(cell.responseRate * 100);
                  return (
                    <div
                      key={h}
                      title={`${day} ${h}h: ${pct}% (${cell.responses}/${cell.attempts} respondidas)`}
                      className={cn(
                        'flex-1 aspect-square rounded-sm mx-px transition-transform hover:scale-110 hover:ring-1 hover:ring-primary/40 flex items-center justify-center text-[9px] font-medium',
                        rateColor(cell.responseRate, cell.attempts),
                      )}
                    >
                      {cell.attempts >= 5 ? `${pct}` : ''}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-3 mt-4 text-[10px] text-muted-foreground">
              <span>Taxa de resposta:</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive/40" /> &lt;10%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning/35" /> 10-25%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning/55" /> 25-40%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/55" /> 40-60%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/80" /> &gt;60%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
