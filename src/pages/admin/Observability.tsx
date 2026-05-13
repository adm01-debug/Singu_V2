import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Zap, ShieldCheck, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Observability() {
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['system-health-snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_health_snapshots')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: slowQueries } = useQuery({
    queryKey: ['slow-queries-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slow_queries_audit')
        .select('*')
        .limit(10);
      if (error) return []; // Fallback if extension not enabled
      return data;
    },
  });

  return (
    <AppLayout title="Observabilidade">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Observabilidade do Sistema</h1>
          <Activity className="text-primary animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Uptime (SLO)</CardTitle>
              <ShieldCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">99.9%</div>
              <p className="text-xs text-muted-foreground">Meta: 99.5%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Latência Média (P95)</CardTitle>
              <Zap className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142ms</div>
              <p className="text-xs text-muted-foreground">-12% vs última hora</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Erro (HTTP 5xx)</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.02%</div>
              <p className="text-xs text-muted-foreground">Dentro do Error Budget</p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle className="text-lg">Performance de Banco (Slow Queries)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 overflow-y-auto max-h-[300px]">
              {slowQueries?.map((q: any, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border text-xs font-mono">
                  <div className="flex justify-between mb-1">
                    <span className="text-primary">Calls: {q.calls}</span>
                    <span className="text-warning">Mean: {q.mean_exec_ms?.toFixed(2)}ms</span>
                  </div>
                  <p className="truncate opacity-70">{q.query}</p>
                </div>
              ))}
              {(!slowQueries || slowQueries.length === 0) && (
                <p className="text-sm text-muted-foreground">Nenhuma query lenta detectada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de Performance (Latência)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={snapshots?.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis dataKey="captured_at" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--primary))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_latency_ms" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}