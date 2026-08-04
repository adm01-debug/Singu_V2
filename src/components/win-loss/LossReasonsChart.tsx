import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import type { WinLossMetrics } from '@/hooks/useWinLoss';

interface Props {
  reasons: WinLossMetrics['reason_distribution'];
}

export function LossReasonsChart({ reasons }: Props) {
  const data = reasons.slice(0, 8);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Motivos por Resultado</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sem dados ainda.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="won" name="Ganhos" fill="hsl(142 71% 45%)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="lost" name="Perdas" fill="hsl(346 77% 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
