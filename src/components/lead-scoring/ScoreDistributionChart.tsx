import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  distribution: { A: number; B: number; C: number; D: number };
}

const COLORS = {
  A: 'hsl(142 71% 45%)',
  B: 'hsl(217 91% 60%)',
  C: 'hsl(38 92% 50%)',
  D: 'hsl(var(--muted-foreground))',
};

function ScoreDistributionChartInner({ distribution }: Props) {
  const data = (['A','B','C','D'] as const).map(g => ({ name: `Grade ${g}`, value: distribution[g], grade: g }));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Distribuição por Grade</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {total === 0 ? (
          <div className="text-sm text-muted-foreground h-full flex items-center justify-center">Sem leads pontuados</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {data.map(d => <Cell key={d.grade} fill={COLORS[d.grade]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export const ScoreDistributionChart = memo(ScoreDistributionChartInner);
