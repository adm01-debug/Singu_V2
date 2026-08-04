import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { TerritoryChartPoint } from '@/hooks/useTerritoryOptimization';

interface Props {
  data: TerritoryChartPoint[];
}

export function TerritoryLoadChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Carga por Território (Top 15)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
            Sem dados de carga disponíveis.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                height={60}
              />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="empresas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="contatos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deals" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
