import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import type { WinLossMetrics } from '@/hooks/useWinLoss';

interface Props {
  competitors: WinLossMetrics['competitor_distribution'];
}

const COLORS = ['hsl(217 91% 60%)', 'hsl(142 71% 45%)', 'hsl(346 77% 50%)', 'hsl(38 92% 50%)', 'hsl(280 65% 60%)', 'hsl(180 65% 45%)'];

export function CompetitorWinRateChart({ competitors }: Props) {
  const data = competitors.slice(0, 6).map(c => ({
    name: c.name,
    value: c.won + c.lost,
    rate: c.rate,
  }));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Win Rate por Concorrente</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de concorrentes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                label={(e: { name: string; rate: number }) => `${e.name} (${e.rate.toFixed(0)}%)`}
                labelLine={false}
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v: number, _n, p: { payload: { rate: number } }) => [`${v} deals (${p.payload.rate.toFixed(1)}% win)`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
