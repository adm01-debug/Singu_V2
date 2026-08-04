import { memo, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TooltipProps } from "recharts";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ObjectionsTrendPoint, ObjectionsTrendSummary } from "@/hooks/useInteractionsInsights";

interface Props {
  data: ObjectionsTrendPoint[];
  summary?: ObjectionsTrendSummary;
}

function formatWeek(w: string): string {
  const d = new Date(w);
  if (isNaN(d.getTime())) return w;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatWeekRange(weekIso: string): string {
  const start = new Date(weekIso);
  if (isNaN(start.getTime())) return formatWeek(weekIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  return `${fmt(start)} – ${fmt(end)}`;
}

// Para risco, "up" = piora; "down" = melhora.
const DIRECTION_LABEL: Record<ObjectionsTrendSummary["direction"], string> = {
  up: "Risco aumentou",
  stable: "Risco estável",
  down: "Risco diminuiu",
};

const DIRECTION_CLASS: Record<ObjectionsTrendSummary["direction"], string> = {
  up: "text-destructive bg-destructive/10 border-destructive/30",
  stable: "text-muted-foreground bg-muted border-border",
  down: "text-success bg-success/10 border-success/30",
};

const DIRECTION_ICON = { up: TrendingUp, stable: Minus, down: TrendingDown } as const;

function ObjectionsTrendTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ObjectionsTrendPoint | undefined;
  if (!point) return null;
  const total = point.total ?? 0;
  return (
    <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-sm p-3 min-w-[200px] max-w-[260px] space-y-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        Semana de {formatWeekRange(point.week)}
      </p>
      {total === 0 ? (
        <p className="text-xs text-muted-foreground">Sem objeções no período</p>
      ) : (
        <>
          <p className="text-xs font-medium text-foreground">
            Total: <span className="tabular-nums">{total}</span> {total === 1 ? "objeção" : "objeções"}
          </p>
          <ul className="space-y-1 text-xs border-t border-border/60 pt-1.5">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-destructive shrink-0" aria-hidden />
              <span className="flex-1 text-foreground">Críticas (não tratadas)</span>
              <span className="tabular-nums font-medium text-destructive">{point.critical}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-sm bg-warning shrink-0" aria-hidden />
              <span className="flex-1 text-foreground">Atenções (tratadas)</span>
              <span className="tabular-nums font-medium text-warning">{point.attention}</span>
            </li>
          </ul>
          <div className="text-[11px] border-t border-border/60 pt-1.5">
            <span className="text-muted-foreground">Risco:</span>{" "}
            <span
              className={cn(
                "font-semibold tabular-nums",
                point.riskPct >= 60 ? "text-destructive" : point.riskPct >= 30 ? "text-warning" : "text-success",
              )}
            >
              {point.riskPct}%
            </span>
            <span className="text-muted-foreground"> não tratadas</span>
          </div>
        </>
      )}
    </div>
  );
}

function ObjectionsTrendChartImpl({ data, summary }: Props) {
  const sortedData = useMemo(() => {
    const safe = Array.isArray(data) ? data : [];
    const seen = new Set<string>();
    const unique: ObjectionsTrendPoint[] = [];
    for (const p of safe) {
      const week = (p.week ?? "").slice(0, 10);
      if (!week || seen.has(week)) continue;
      seen.add(week);
      unique.push({ ...p, week });
    }
    unique.sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
    return unique;
  }, [data]);

  if (sortedData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Sem objeções registradas no período selecionado.
      </p>
    );
  }

  if (sortedData.length < 2) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center py-6">
          Dados insuficientes para tendência (mín. 2 semanas).
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Críticas</p>
            <p className="text-lg font-semibold text-destructive tabular-nums">{sortedData[0]?.critical ?? 0}</p>
          </div>
          <div className="rounded-md border border-warning/30 bg-warning/5 p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Atenções</p>
            <p className="text-lg font-semibold text-warning tabular-nums">{sortedData[0]?.attention ?? 0}</p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = summary ? DIRECTION_ICON[summary.direction] : Minus;
  const deltaSign = summary && summary.deltaRiskPp > 0 ? "+" : summary && summary.deltaRiskPp < 0 ? "−" : "";
  const deltaAbs = summary ? Math.abs(summary.deltaRiskPp) : 0;

  return (
    <div className="space-y-3">
      {summary && (
        <div className={cn("rounded-md border px-3 py-2 flex items-center justify-between flex-wrap gap-2", DIRECTION_CLASS[summary.direction])}>
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold">{DIRECTION_LABEL[summary.direction]}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {summary.totalCritical} crítica{summary.totalCritical === 1 ? "" : "s"} · {summary.totalAttention} atenção
              {summary.totalAttention === 1 ? "" : "ões"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {summary.peakWeek && summary.peakWeek.critical > 0 && (
              <Badge variant="outline" className="gap-1 text-[10px] tabular-nums border-destructive/40 text-destructive">
                <Flame className="h-3 w-3" />
                Pico: {formatWeek(summary.peakWeek.week)} ({summary.peakWeek.critical})
              </Badge>
            )}
            <Badge variant="outline" className={cn("gap-1 text-[10px] tabular-nums", DIRECTION_CLASS[summary.direction])}>
              {deltaSign}
              {deltaAbs}pp risco
            </Badge>
          </div>
        </div>
      )}

      <div className="h-[220px] w-full" role="img" aria-label="Gráfico de evolução semanal de objeções críticas e atenções">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sortedData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeek}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              unit="%"
            />
            <Tooltip content={<ObjectionsTrendTooltip />} cursor={{ fill: "hsl(var(--muted)/0.4)" }} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="square"
              formatter={(v) => <span className="text-muted-foreground">{v}</span>}
            />
            <Bar
              yAxisId="left"
              dataKey="critical"
              name="Críticas"
              stackId="obj"
              fill="hsl(var(--destructive))"
              radius={[2, 2, 0, 0]}
              maxBarSize={36}
            />
            <Bar
              yAxisId="left"
              dataKey="attention"
              name="Atenções"
              stackId="obj"
              fill="hsl(var(--warning))"
              radius={[2, 2, 0, 0]}
              maxBarSize={36}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="riskPct"
              name="% Risco"
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: "hsl(var(--foreground))" }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
        <AlertTriangle className="h-3 w-3 shrink-0" />
        Críticas = objeções não tratadas no momento. Atenções = mencionadas e tratadas. A linha mostra o % de risco semanal.
      </p>
    </div>
  );
}

export const ObjectionsTrendChart = memo(ObjectionsTrendChartImpl);
