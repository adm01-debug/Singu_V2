import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, MessageCircle, Mail, Phone, Users, Trophy, Workflow, Lightbulb } from 'lucide-react';
import { useTouchpointSequences, SEQ_CHANNEL_LABELS, type SeqChannel, type SequenceStat } from '@/hooks/useTouchpointSequences';

const CHANNEL_ICONS: Record<SeqChannel, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  email: Mail,
  call: Phone,
  meeting: Users,
};

const LENGTHS = [2, 3, 4, 5] as const;
type Length = typeof LENGTHS[number];

function SequenceRow({ stat, rank }: { stat: SequenceStat; rank: number }) {
  const isTop = rank === 0;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-md border p-3 ${isTop ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 flex-wrap min-w-0">
        <Badge variant={isTop ? 'default' : 'secondary'} className="shrink-0">#{rank + 1}</Badge>
        {stat.sequence.map((ch, idx) => {
          const Icon = CHANNEL_ICONS[ch];
          return (
            <div key={`${stat.key}-${idx}`} className="flex items-center gap-1">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1">
                      <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                      <span className="text-xs font-medium">{SEQ_CHANNEL_LABELS[ch]}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{SEQ_CHANNEL_LABELS[ch]}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {idx < stat.sequence.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />}
            </div>
          );
        })}
        {isTop && (
          <Badge variant="outline" className="border-primary/50 text-primary gap-1">
            <Trophy className="w-3 h-3" aria-hidden="true" /> Top
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-right">
        <div>
          <div className="text-lg font-bold text-primary leading-none">{stat.winRate}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">conversão</div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-sm font-semibold leading-none">{stat.won}/{stat.totalDeals}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">won/deals</div>
        </div>
      </div>
    </div>
  );
}

export function TouchpointSequenceCard() {
  const { data, isLoading, error } = useTouchpointSequences();
  const [length, setLength] = useState<Length>(3);

  const list = useMemo(() => data?.byLength[length] ?? [], [data, length]);
  const insight = data?.topInsight ?? null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Workflow className="w-5 h-5 text-primary" aria-hidden="true" />Sequências de Toques</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Workflow className="w-5 h-5 text-primary" aria-hidden="true" />Sequências de Toques</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-destructive">Erro ao carregar sequências.</p></CardContent>
      </Card>
    );
  }

  const totalClosed = data?.totalClosedDeals ?? 0;
  const noData = totalClosed < 10;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" aria-hidden="true" />
            <CardTitle>Sequências de Toques que Convertem</CardTitle>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {LENGTHS.map(n => (
              <Button
                key={n}
                size="sm"
                variant={length === n ? 'default' : 'ghost'}
                className="h-7 px-2 text-xs"
                onClick={() => setLength(n)}
                aria-label={`Filtrar sequências de ${n} toques`}
              >
                {n} toques
              </Button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ordem temporal dos canais usados em deals fechados (180d) — {totalClosed} deals analisados
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {noData ? (
          <div className="text-center py-8">
            <Workflow className="w-10 h-10 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Mínimo de 10 deals fechados necessário.</p>
            <p className="text-xs text-muted-foreground mt-1">Continue registrando interações e fechamentos.</p>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Nenhuma sequência de {length} toques com dados suficientes (mín 3 deals).</p>
          </div>
        ) : (
          <>
            {list.map((stat, idx) => <SequenceRow key={stat.key} stat={stat} rank={idx} />)}
            {insight && (
              <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 mt-2">
                <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm">
                  <span className="font-semibold">Sequência campeã:</span>{' '}
                  {insight.sequence.map(c => SEQ_CHANNEL_LABELS[c]).join(' → ')}{' '}
                  — <span className="font-semibold text-primary">{insight.winRate}% de conversão</span>{' '}
                  em {insight.totalDeals} deals.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
