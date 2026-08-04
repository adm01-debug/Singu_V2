import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Inbox, Flame, MessageCircle, Mail, Phone, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInboundActivityHeatmap, INBOUND_HEATMAP_CONSTANTS, type InboundChannel } from '@/hooks/useInboundActivityHeatmap';

const { DAY_LABELS, HOUR_START, HOUR_END } = INBOUND_HEATMAP_CONSTANTS;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);

function intensityClass(intensity: number, count: number): string {
  if (count === 0) return 'bg-muted/30';
  if (intensity > 0.75) return 'bg-primary';
  if (intensity > 0.5) return 'bg-primary/70';
  if (intensity > 0.25) return 'bg-primary/45';
  if (intensity > 0.1) return 'bg-primary/25';
  return 'bg-primary/15';
}

export function InboundActivityHeatmapCard() {
  const [channel, setChannel] = useState<InboundChannel>('all');
  const { data, loading } = useInboundActivityHeatmap(channel);

  const peakSet = useMemo(() => {
    if (!data) return new Set<string>();
    return new Set(data.peaks.map(p => `${p.dayOfWeek}-${p.hour}`));
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Inbox className="w-4 h-4 text-primary" />
            Quando seus Clientes te Procuram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Inbox className="w-4 h-4 text-primary" />
              Quando seus Clientes te Procuram
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Volume de interações iniciadas pelos clientes (últimos 90d)
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 shrink-0 rounded-md border border-border/60 p-0.5">
            {([
              { v: 'all', label: 'Todos', icon: null },
              { v: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
              { v: 'email', label: 'Email', icon: Mail },
              { v: 'call', label: 'Call', icon: Phone },
            ] as const).map(opt => {
              const Icon = opt.icon;
              const active = channel === opt.v;
              return (
                <Button
                  key={opt.v}
                  type="button"
                  size="sm"
                  variant={active ? 'secondary' : 'ghost'}
                  className="h-6 px-2 text-[10px] gap-1"
                  onClick={() => setChannel(opt.v as InboundChannel)}
                  aria-label={opt.label}
                  aria-pressed={active}
                >
                  {Icon ? <Icon className="w-3 h-3" /> : opt.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!data.hasEnoughData ? (
          <div className="text-center py-10 px-4 border border-dashed border-border rounded-lg">
            <Inbox className="w-10 h-10 mx-auto mb-3 text-muted-foreground/70" />
            <p className="text-sm font-medium mb-1">Sem dados suficientes</p>
            <p className="text-xs text-muted-foreground mb-1">
              Precisamos de pelo menos 10 interações inbound nos últimos 90 dias.
            </p>
            <p className="text-xs text-muted-foreground">
              {channel === 'all'
                ? `Encontradas: ${data.total}`
                : `Filtrado por canal: ${data.total}. Tente "Todos".`}
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                  <TrendingUp className="w-3 h-3" />
                  Total
                </div>
                <div className="text-lg font-semibold mt-0.5">{data.total}</div>
                <div className="text-[10px] text-muted-foreground">interações</div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Dia top</div>
                <div className="text-lg font-semibold mt-0.5">{data.topDay?.label ?? '—'}</div>
                <div className="text-[10px] text-muted-foreground">{data.topDay?.count ?? 0} contatos</div>
              </div>
              <div className="rounded-md border border-border/60 bg-muted/20 p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Hora top</div>
                <div className="text-lg font-semibold mt-0.5">{data.topHour?.label ?? '—'}</div>
                <div className="text-[10px] text-muted-foreground">{data.topHour?.count ?? 0} contatos</div>
              </div>
            </div>

            {/* Heatmap */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="min-w-[480px]">
                <div className="flex mb-1 ml-9">
                  {HOURS.map(h => (
                    <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground">
                      {h}
                    </div>
                  ))}
                </div>

                {DAY_LABELS.map((day, dayIdx) => (
                  <div key={day} className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">{day}</span>
                    <div className="flex flex-1 gap-0.5">
                      {HOURS.map(hour => {
                        const cellIdx = dayIdx * HOURS.length + (hour - HOUR_START);
                        const cell = data.cells[cellIdx];
                        const isPeak = peakSet.has(`${dayIdx}-${hour}`);
                        return (
                          <div
                            key={hour}
                            className={cn(
                              'flex-1 aspect-square rounded-sm transition-all relative',
                              intensityClass(cell.intensity, cell.count),
                              isPeak && 'ring-1 ring-warning ring-offset-1 ring-offset-background'
                            )}
                            title={`${day} ${hour}h: ${cell.count} interação${cell.count !== 1 ? 'ões' : ''}${isPeak ? ' 🔥 Pico' : ''}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-[9px] text-muted-foreground">Menos</span>
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-muted/30" />
                    <div className="w-3 h-3 rounded-sm bg-primary/15" />
                    <div className="w-3 h-3 rounded-sm bg-primary/25" />
                    <div className="w-3 h-3 rounded-sm bg-primary/45" />
                    <div className="w-3 h-3 rounded-sm bg-primary/70" />
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                  </div>
                  <span className="text-[9px] text-muted-foreground">Mais</span>
                </div>
              </div>
            </div>

            {/* Peaks */}
            {data.peaks.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Flame className="w-3 h-3 text-warning" />
                  Top 3 janelas de pico
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.peaks.map((p, i) => (
                    <Badge key={`${p.dayOfWeek}-${p.hour}`} variant="outline" className="gap-1 text-[10px] border-warning/40 bg-warning/5">
                      <span className="font-semibold">#{i + 1}</span>
                      {p.dayLabel} • {p.hourLabel}
                      <span className="text-muted-foreground">({p.count})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Insight */}
            {data.topDay && data.topHour && (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 flex gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Seus clientes mais te procuram <strong>{data.topDay.label}</strong> por volta das{' '}
                  <strong>{data.topHour.label}</strong>. Considere bloquear esse horário para responder rapidamente
                  {channel !== 'all' && ` no canal ${channel}`}.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
