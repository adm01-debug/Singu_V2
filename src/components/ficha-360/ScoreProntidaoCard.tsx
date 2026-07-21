import { memo, useMemo, useState } from 'react';
import { Calendar, Clock, Smile, Radio, Lightbulb, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { WhyScoreDrawer, type WhyScoreFactor } from '@/components/intelligence/WhyScoreDrawer';
import { ProntidaoWeightsEditor } from '@/components/ficha-360/ProntidaoWeightsEditor';
import type { ProntidaoResult, ProntidaoLevel, ProntidaoStatus } from '@/domain/leadScoring';

interface Props {
  data: ProntidaoResult;
  contactId?: string;
  simulated?: boolean;
  /** Resultado real (sem simulação) para comparativo lado a lado quando `simulated` está ativo. */
  realData?: ProntidaoResult;
}

const levelClasses: Record<ProntidaoLevel, { badge: string; ring: string; text: string }> = {
  pronto: { badge: 'bg-success/15 text-success border-success/30', ring: 'text-success', text: 'text-success' },
  quente: { badge: 'bg-primary/15 text-primary border-primary/30', ring: 'text-primary', text: 'text-primary' },
  morno: { badge: 'bg-warning/15 text-warning border-warning/30', ring: 'text-warning', text: 'text-warning' },
  frio: { badge: 'bg-destructive/15 text-destructive border-destructive/30', ring: 'text-destructive', text: 'text-destructive' },
};

const statusBar: Record<ProntidaoStatus, string> = {
  good: 'bg-success',
  warn: 'bg-warning',
  bad: 'bg-destructive',
  unknown: 'bg-muted-foreground/40',
};

const ScoreRing = ({ score, level }: { score: number; level: ProntidaoLevel }) => {
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const cls = levelClasses[level];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="currentColor" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className={cn('transition-all duration-700', cls.ring)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold tabular-nums', cls.text)}>{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">de 100</span>
      </div>
    </div>
  );
};

const factorIcons = {
  cadence: Calendar,
  recency: Clock,
  sentiment: Smile,
  channel: Radio,
} as const;

export const ScoreProntidaoCard = memo(({ data, contactId, simulated, realData }: Props) => {
  const cls = levelClasses[data.level];
  const [whyOpen, setWhyOpen] = useState(false);
  const showCompare = !!simulated && !!realData;
  const factors: Array<{
    key: keyof typeof factorIcons;
    factor: typeof data.breakdown.cadence;
    real?: typeof data.breakdown.cadence;
  }> = [
    { key: 'cadence', factor: data.breakdown.cadence, real: realData?.breakdown.cadence },
    { key: 'recency', factor: data.breakdown.recency, real: realData?.breakdown.recency },
    { key: 'sentiment', factor: data.breakdown.sentiment, real: realData?.breakdown.sentiment },
    { key: 'channel', factor: data.breakdown.channel, real: realData?.breakdown.channel },
  ];

  const totalDelta = showCompare ? data.score - (realData?.score ?? data.score) : 0;

  const whyFactors = useMemo<WhyScoreFactor[]>(
    () =>
      factors.map(({ key, factor }) => ({
        key,
        label: factor.label,
        score: factor.score,
        weight: factor.weight / 100,
        detail: factor.detail,
      })),
    // factors is derived from data + realData inline above
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, realData],
  );

  const band: 'low' | 'mid' | 'high' =
    data.level === 'pronto' || data.level === 'quente' ? 'high' : data.level === 'morno' ? 'mid' : 'low';

  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="grid gap-5 md:grid-cols-[auto_1fr] items-start">
          {/* Esquerda: ring + nível */}
          <div className="flex flex-col items-center gap-3 md:pr-5 md:border-r md:border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              Prontidão
              {simulated && (
                <Badge variant="outline" className="ml-1 border-warning/40 bg-warning/10 text-warning text-[9px] px-1.5 py-0">
                  Simulação
                </Badge>
              )}
            </div>
            <ScoreRing score={data.score} level={data.level} />
            <Badge className={cn('text-xs font-medium border', cls.badge)}>
              {data.levelLabel}
            </Badge>
          </div>

          {/* Direita: breakdown + recomendação */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between -mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Fatores
              </span>
              <ProntidaoWeightsEditor contactId={contactId} />
            </div>
            {showCompare && (
              <div className="flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 px-2.5 py-1.5 text-[11px]">
                <span className="text-muted-foreground">
                  Real: <span className="font-semibold tabular-nums text-foreground">{realData?.score}</span>
                  <span className="mx-1.5 text-muted-foreground/70">·</span>
                  Simulado: <span className="font-semibold tabular-nums text-foreground">{data.score}</span>
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'tabular-nums text-[10px] px-1.5 py-0',
                    totalDelta > 0 && 'border-success/40 bg-success/10 text-success',
                    totalDelta < 0 && 'border-destructive/40 bg-destructive/10 text-destructive',
                    totalDelta === 0 && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {totalDelta > 0 ? '+' : ''}
                  {totalDelta} pts
                </Badge>
              </div>
            )}
            <div className="space-y-2.5">
              {factors.map(({ key, factor, real }) => {
                const Icon = factorIcons[key];
                const delta = real ? factor.score - real.score : 0;
                return (
                  <div key={key} className="space-y-1">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-32 min-w-0">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{factor.label}</span>
                        <span className="text-[10px] text-muted-foreground/70">{factor.weight}%</span>
                      </div>
                      <Progress
                        value={factor.score}
                        className="h-1.5 bg-muted"
                        indicatorClassName={cn('bg-gradient-to-r from-current to-current', statusBar[factor.status])}
                      />
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                        {factor.score}
                      </span>
                    </div>
                    {showCompare && real && (
                      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 pl-0.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 w-32 min-w-0">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50 ml-[18px]" aria-hidden="true" />
                          <span className="truncate">Real</span>
                        </div>
                        <Progress
                          value={real.score}
                          className="h-1 bg-muted/60"
                          indicatorClassName={cn('opacity-60', statusBar[real.status])}
                        />
                        <span
                          className={cn(
                            'text-[10px] tabular-nums w-10 text-right',
                            delta > 0 && 'text-success',
                            delta < 0 && 'text-destructive',
                            delta === 0 && 'text-muted-foreground',
                          )}
                        >
                          {real.score}
                          <span className="ml-1 text-[9px]">
                            ({delta > 0 ? '+' : ''}
                            {delta})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* detalhes pequenos */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
                {factors.map(({ key, factor, real }) => (
                  <div key={`${key}-d`} className="truncate">
                    <span className="font-medium text-foreground/70">{factor.label}:</span> {factor.detail}
                    {showCompare && real && real.detail !== factor.detail && (
                      <span className="ml-1 text-muted-foreground/70">
                        (real: {real.detail})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className={cn('h-4 w-4 mt-0.5 shrink-0', cls.text)} />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm leading-relaxed">{data.recommendation}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">Próxima ação sugerida:</span> {data.nextActionHint}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={() => setWhyOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Por que esse score?
            </Button>
          </div>
        </div>
      </CardContent>

      <WhyScoreDrawer
        open={whyOpen}
        onOpenChange={setWhyOpen}
        scoreKey={`prontidao:contact:${contactId ?? 'anon'}`}
        title="Por que esse score?"
        subtitle={`${data.score}/100 — ${data.levelLabel}`}
        score={data.score}
        factors={whyFactors}
        recommendations={[data.recommendation, `Próxima ação: ${data.nextActionHint}`]}
        band={band}
      />
    </Card>
  );
});
ScoreProntidaoCard.displayName = 'ScoreProntidaoCard';
