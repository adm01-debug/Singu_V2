import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface Row {
  vote: -1 | 1;
  created_at: string;
}

interface WeekPoint {
  week: string;
  up: number;
  down: number;
  approval: number;
}

function startOfWeekISO(d: Date): string {
  const x = new Date(d);
  const day = (x.getUTCDay() + 6) % 7; // segunda = 0
  x.setUTCDate(x.getUTCDate() - day);
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function buildWeeks(rows: Row[], weeks = 12): WeekPoint[] {
  const buckets = new Map<string, { up: number; down: number }>();
  // Seed últimas N semanas para eixo estável
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i * 7);
    buckets.set(startOfWeekISO(d), { up: 0, down: 0 });
  }
  for (const r of rows) {
    const wk = startOfWeekISO(new Date(r.created_at));
    if (!buckets.has(wk)) continue;
    const b = buckets.get(wk)!;
    if (r.vote === 1) b.up += 1; else b.down += 1;
  }
  return Array.from(buckets.entries()).map(([week, v]) => {
    const total = v.up + v.down;
    return {
      week: week.slice(5), // MM-DD
      up: v.up,
      down: v.down,
      approval: total > 0 ? Math.round((v.up / total) * 100) : 0,
    };
  });
}

export function InsightFeedbackTrendChart({ rows }: { rows: Row[] }) {
  const data = useMemo(() => buildWeeks(rows, 12), [rows]);
  const hasAny = rows.length > 0;

  if (!hasAny) {
    return (
      <div className="flex h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Sem feedback registrado ainda — o gráfico será exibido conforme os usuários avaliarem insights.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="approvalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="week" fontSize={11} className="text-muted-foreground" />
          <YAxis
            fontSize={11}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'approval') return [`${value}%`, 'Aprovação'];
              return [value, name === 'up' ? '👍' : '👎'];
            }}
            labelFormatter={(l) => `Semana de ${l}`}
          />
          <Area
            type="monotone"
            dataKey="approval"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#approvalFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}