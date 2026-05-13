import { memo, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccessibleChart } from '@/components/ui/accessible-chart';
import type { ProntidaoTrendPoint } from '@/domain/churnRisk';

interface Props {
  data: ProntidaoTrendPoint[];
  /** Quando true, mostra contribuição relativa (% do score da semana) em vez de absoluta. */
  asPercent?: boolean;
}

/**
 * Decomposição da tendência por fator: Cadência, Recência, Sentimento e Canal.
 * Reusa as `contribution` já calculadas em `computeProntidaoTrend` (somam ≈ score).
 */
const FACTOR_META = [
  { key: 'cadence', label: 'Cadência', cssVar: '--primary' },
  { key: 'recency', label: 'Recência', cssVar: '--success' },
  { key: 'sentiment', label: 'Sentimento', cssVar: '--warning' },
  { key: 'channel', label: 'Canal', cssVar: '--accent-foreground' },
] as const;

type FactorKey = (typeof FACTOR_META)[number]['key'];

interface ChartRow {
  weekLabel: string;
  weekStart: string;
  hasData: boolean;
  cadence: number;
  recency: number;
  sentiment: number;
  channel: number;
  total: number;
}

function buildRows(data: ProntidaoTrendPoint[], asPercent: boolean): ChartRow[] {
  return data.map((p) => {
    const c = p.contribution ?? { cadence: 0, recency: 0, sentiment: 0, channel: 0 };
    const total = c.cadence + c.recency + c.sentiment + c.channel;
    if (asPercent && total > 0) {
      return {
        weekLabel: p.weekLabel,
        weekStart: p.weekStart,
        hasData: p.hasData,
        cadence: Math.round((c.cadence / total) * 100),
        recency: Math.round((c.recency / total) * 100),
        sentiment: Math.round((c.sentiment / total) * 100),
        channel: Math.round((c.channel / total) * 100),
        total: 100,
      };
    }
    return {
      weekLabel: p.weekLabel,
      weekStart: p.weekStart,
      hasData: p.hasData,
      cadence: c.cadence,
      recency: c.recency,
      sentiment: c.sentiment,
      channel: c.channel,
      total,
    };
  });
}

const TooltipContent = ({
  active,
  payload,
  asPercent,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  asPercent: boolean;
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  if (!row.hasData) {
    return (
      <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground">
        <div className="font-medium">Semana de {row.weekLabel}</div>
        <div className="text-muted-foreground">Sem interações registradas</div>
      </div>
    );
  }
  const unit = asPercent ? '%' : ' pts';
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground space-y-0.5">
      <div className="font-medium">Semana de {row.weekLabel}</div>
      <div className="text-muted-foreground pb-1">
        Total: <span className="tabular-nums font-semibold text-foreground">{row.total}{unit}</span>
      </div>
      {FACTOR_META.map((f) => (
        <div key={f.key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: `hsl(var(${f.cssVar}))` }}
            aria-hidden="true"
          />
          <span className="flex-1">{f.label}</span>
          <span className="tabular-nums font-medium">
            {row[f.key as FactorKey]}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
};

function ProntidaoFactorBreakdownChartImpl({ data, asPercent = false }: Props) {
  const rows = useMemo(() => buildRows(data, asPercent), [data, asPercent]);
  const hasAnyData = rows.some((r) => r.hasData);

  const tableRows = useMemo(
    () =>
      rows
        .filter((r) => r.hasData)
        .map((r) => ({
          label: `Sem. ${r.weekLabel}`,
          value: `Cad ${r.cadence} · Rec ${r.recency} · Sent ${r.sentiment} · Can ${r.channel}`,
        })),
    [rows],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Decomposição por fator
          <Badge variant="outline" className="text-[10px] ml-auto">
            {asPercent ? '%' : 'pts'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {!hasAnyData ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            Sem dados suficientes para decompor a tendência.
          </p>
        ) : (
          <>
            <AccessibleChart
              summary={`Decomposição semanal por fator em ${asPercent ? 'porcentagem' : 'pontos'}`}
              data={tableRows}
              columns={['Semana', 'Contribuição (cad/rec/sent/canal)']}
            >
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rows} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      {FACTOR_META.map((f) => (
                        <linearGradient
                          key={f.key}
                          id={`fill-${f.key}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={`hsl(var(${f.cssVar}))`} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={`hsl(var(${f.cssVar}))`} stopOpacity={0.15} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={asPercent ? [0, 100] : [0, 100]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      content={(props) => (
                        <TooltipContent
                          {...(props as { active?: boolean; payload?: Array<{ payload: ChartRow }> })}
                          asPercent={asPercent}
                        />
                      )}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span className="text-muted-foreground">{value}</span>
                      )}
                    />
                    {FACTOR_META.map((f) => (
                      <Area
                        key={f.key}
                        type="monotone"
                        dataKey={f.key}
                        name={f.label}
                        stackId="1"
                        stroke={`hsl(var(${f.cssVar}))`}
                        strokeWidth={1.5}
                        fill={`url(#fill-${f.key})`}
                        isAnimationActive={false}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AccessibleChart>
            <p className="text-[11px] text-muted-foreground">
              Áreas empilhadas mostram quanto cada fator contribui para o score semanal
              {asPercent ? ' (em % do total da semana)' : ' (em pontos ponderados que somam o score)'}.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const ProntidaoFactorBreakdownChart = memo(ProntidaoFactorBreakdownChartImpl);
