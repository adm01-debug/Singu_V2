import { memo, useMemo } from 'react';

interface HeatPoint { date: string; count: number; }

interface TemporalHeatmapProps {
  data: HeatPoint[];
  /** Número de dias a exibir (default 30) */
  days?: number;
}

/**
 * Heatmap GitHub-like: grid 7 (dias da semana) × N (semanas).
 * Intensidade do cyan reflete count normalizado.
 */
export const TemporalHeatmap = memo(({ data, days = 30 }: TemporalHeatmapProps) => {
  const { cells, max, weeks } = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(d.date, d.count));

    const out: Array<{ date: string; count: number; dow: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ date: iso, count: map.get(iso) || 0, dow: d.getDay() });
    }

    const maxCount = Math.max(1, ...out.map((c) => c.count));
    return { cells: out, max: maxCount, weeks: Math.ceil(out.length / 7) };
  }, [data, days]);

  return (
    <div className="space-y-2">
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
        role="img"
        aria-label={`Heatmap temporal de ${cells.length} dias`}
      >
        {cells.map((c) => {
          const intensity = c.count / max;
          const bg = c.count === 0
            ? 'hsl(var(--intel-surface-2))'
            : `hsl(var(--intel-accent) / ${0.18 + intensity * 0.7})`;
          return (
            <div
              key={c.date}
              title={`${c.date}: ${c.count} interação(ões)`}
              className="aspect-square rounded-[2px] border border-border/30"
              style={{ backgroundColor: bg }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-1.5 intel-mono text-[10px] text-muted-foreground">
        <span>MENOS</span>
        {[0.1, 0.3, 0.55, 0.8, 1].map((i, idx) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-[2px] border border-border/40"
            style={{ backgroundColor: idx === 0 ? 'hsl(var(--intel-surface-2))' : `hsl(var(--intel-accent) / ${i})` }}
          />
        ))}
        <span>MAIS</span>
      </div>
    </div>
  );
});

TemporalHeatmap.displayName = 'TemporalHeatmap';
