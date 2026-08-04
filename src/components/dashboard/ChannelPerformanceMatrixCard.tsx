import { useMemo } from 'react';
import { MessageSquare, Mail, Phone, Users, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useChannelPerformanceMatrix,
  CHANNELS,
  STAGES,
  STAGE_LABELS,
  CHANNEL_LABELS,
  type Channel,
  type Stage,
} from '@/hooks/useChannelPerformanceMatrix';

const CHANNEL_ICONS: Record<Channel, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageSquare,
  email: Mail,
  call: Phone,
  meeting: Users,
};

function intensityClass(rate: number, total: number): string {
  if (total < 3) return 'bg-muted/30 text-muted-foreground';
  if (rate >= 50) return 'bg-primary/25 text-foreground';
  if (rate >= 30) return 'bg-primary/15 text-foreground';
  if (rate >= 15) return 'bg-primary/10 text-foreground';
  if (rate > 0) return 'bg-primary/5 text-foreground';
  return 'bg-muted/20 text-muted-foreground';
}

export function ChannelPerformanceMatrixCard() {
  const { data, isLoading } = useChannelPerformanceMatrix();

  const cellMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof Object> & { total: number; rate: number; avgDays: number | null }>();
    if (!data) return m;
    for (const c of data.cells) m.set(`${c.channel}|${c.stage}`, c);
    return m;
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Performance por Canal × Estágio</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-64 w-full" /></CardContent>
      </Card>
    );
  }

  if (!data || data.totalInteractions < 30) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance por Canal × Estágio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Dados insuficientes</p>
            <p className="text-sm mt-1">Capture pelo menos 30 interações nos últimos 180 dias para desbloquear esta análise.</p>
            <p className="text-xs mt-2">Total atual: {data?.totalInteractions ?? 0} interações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance por Canal × Estágio
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de avanço de estágio em até 30 dias após interação · últimos 180 dias
            </p>
          </div>
          <Badge variant="outline" className="text-xs">{data.totalInteractions} interações</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[640px]">
            <thead>
              <tr>
                <th className="text-left p-2 text-xs font-medium text-muted-foreground">Canal</th>
                {STAGES.map(stage => (
                  <th key={stage} className="text-center p-2 text-xs font-medium text-muted-foreground">
                    {STAGE_LABELS[stage]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHANNELS.map(channel => {
                const Icon = CHANNEL_ICONS[channel];
                return (
                  <tr key={channel}>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{CHANNEL_LABELS[channel]}</span>
                      </div>
                    </td>
                    {STAGES.map(stage => {
                      const cell = cellMap.get(`${channel}|${stage}`);
                      const isWinner = data.winnerByStage[stage as Stage] === channel;
                      const total = cell?.total ?? 0;
                      const rate = cell?.rate ?? 0;
                      const avgDays = cell?.avgDays ?? null;
                      const avgDaysSuffix = avgDays !== null ? ` · ~${avgDays}d` : '';
                      return (
                        <td key={stage} className="p-1">
                          <div
                            className={cn(
                              'rounded-md p-2 text-center transition-all relative',
                              intensityClass(rate, total),
                              isWinner && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                            )}
                            title={`${CHANNEL_LABELS[channel]} em ${STAGE_LABELS[stage as Stage]}\n${total} interações · ${rate}% avanço${avgDaysSuffix}`}
                          >
                            {isWinner && (
                              <Trophy className="w-3 h-3 text-primary absolute top-0.5 right-0.5" aria-label="Top" />
                            )}
                            <div className="font-semibold text-base">{total > 0 ? `${rate}%` : '—'}</div>
                            <div className="text-[10px] opacity-70 mt-0.5">
                              {total} {total === 1 ? 'int' : 'ints'}
                              {avgDays !== null && ` · ${avgDays}d`}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {data.bestInsight && (
          <div className="rounded-md bg-primary/5 border border-primary/20 p-3 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Insight: </span>
              Para mover deals de <span className="font-semibold">{STAGE_LABELS[data.bestInsight.from]}</span> para{' '}
              <span className="font-semibold">{STAGE_LABELS[data.bestInsight.to]}</span>, use{' '}
              <span className="font-semibold text-primary">{CHANNEL_LABELS[data.bestInsight.channel]}</span>{' '}
              ({data.bestInsight.rate}% de taxa de avanço).
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>Intensidade:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-muted/30" />
            <span>baixo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-primary/10" />
            <span>médio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-primary/25" />
            <span>alto</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Trophy className="w-3 h-3 text-primary" />
            <span>vencedor do estágio</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
