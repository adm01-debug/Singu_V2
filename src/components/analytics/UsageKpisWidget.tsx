import { Activity, Users, MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUsageKpisView } from '@/hooks/useUsageKpisView';
import { cn } from '@/lib/utils';

interface KpiRecord {
  metric_name?: string;
  metric_value?: number;
  metric_label?: string;
  category?: string;
  trend?: string;
  change_pct?: number;
  [key: string]: unknown;
}

const ICON_MAP: Record<string, typeof Activity> = {
  users: Users,
  interactions: MessageSquare,
  growth: TrendingUp,
  engagement: Activity,
};

export function UsageKpisWidget() {
  const { data, isLoading, error } = useUsageKpisView();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" /> KPIs de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">Erro ao carregar KPIs</p>
        </CardContent>
      </Card>
    );
  }

  const records = (data as KpiRecord[]) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          KPIs de Uso
        </CardTitle>
        <CardDescription>Métricas de utilização e adoção do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {records.slice(0, 8).map((kpi, i) => {
            const Icon = ICON_MAP[kpi.category?.toLowerCase() || ''] || Activity;
            const value = kpi.metric_value ?? 0;
            const changePct = kpi.change_pct;

            return (
              <div key={kpi.metric_name || i} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {kpi.metric_label || kpi.metric_name || `KPI ${i + 1}`}
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                </p>
                {changePct != null && (
                  <span className={cn('text-xs font-medium',
                    changePct > 0 ? 'text-success' : changePct < 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {changePct > 0 ? '+' : ''}{changePct.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
