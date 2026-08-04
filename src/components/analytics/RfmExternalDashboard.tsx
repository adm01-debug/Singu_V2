import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRfmDashboard } from '@/hooks/useReportsAnalytics';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { Users, TrendingUp, Clock, DollarSign, AlertTriangle } from 'lucide-react';

const SEGMENT_COLORS: Record<string, string> = {
  Champions: 'hsl(142, 76%, 36%)',
  'Loyal Customers': 'hsl(221, 83%, 53%)',
  'Potential Loyalist': 'hsl(47, 96%, 53%)',
  'At Risk': 'hsl(0, 84%, 60%)',
  'Need Attention': 'hsl(25, 95%, 53%)',
  Hibernating: 'hsl(215, 16%, 47%)',
  Lost: 'hsl(0, 0%, 45%)',
  'New Customers': 'hsl(172, 66%, 50%)',
  'About to Sleep': 'hsl(262, 52%, 47%)',
  Promising: 'hsl(142, 52%, 50%)',
};

const getColor = (segment: string) => SEGMENT_COLORS[segment] || 'hsl(var(--muted-foreground))';

export const RfmExternalDashboard = React.memo(function RfmExternalDashboard() {
  const { data, isLoading, error } = useRfmDashboard();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
          <p className="text-sm">Dados RFM indisponíveis no momento.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { segments, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{summary.total_customers}</p>
            <p className="text-xs text-muted-foreground">Total Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-2xl font-bold">{summary.avg_recency.toFixed(0)}d</p>
            <p className="text-xs text-muted-foreground">Recência Média</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold">{summary.avg_frequency.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Frequência Média</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(summary.avg_monetary)}
            </p>
            <p className="text-xs text-muted-foreground">Valor Médio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Segment Distribution Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribuição por Segmento</CardTitle>
            <CardDescription className="text-xs">Quantidade de clientes por segmento RFM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segments} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis type="category" dataKey="segment" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    formatter={(v: number, _: unknown, entry: { payload: { percentage: number } }) => [`${v} (${entry.payload.percentage.toFixed(1)}%)`, 'Clientes']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {segments.map((seg) => (
                      <Cell key={seg.segment} fill={getColor(seg.segment)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Segment Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Composição do Portfólio</CardTitle>
            <CardDescription className="text-xs">Percentual de cada segmento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments}
                    dataKey="percentage"
                    nameKey="segment"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ segment, percentage }) => `${segment}: ${percentage.toFixed(0)}%`}
                  >
                    {segments.map((seg) => (
                      <Cell key={seg.segment} fill={getColor(seg.segment)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segments Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Detalhamento por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {segments.map((seg) => (
              <div key={seg.segment} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(seg.segment) }} />
                  <span className="font-medium text-sm">{seg.segment}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline" className="text-xs">{seg.count} clientes</Badge>
                  <span className="text-muted-foreground">{seg.percentage.toFixed(1)}%</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(seg.avg_revenue)}
                    <span className="text-xs text-muted-foreground ml-1">avg</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default RfmExternalDashboard;
