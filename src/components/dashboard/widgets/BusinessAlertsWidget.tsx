import { AlertTriangle, TrendingDown, Users, Building2, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBusinessAlerts, type BusinessAlert } from '@/hooks/useBusinessAlerts';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG: Record<string, { color: string; label: string }> = {
  critical: { color: 'border-destructive bg-destructive/10', label: 'Crítico' },
  high: { color: 'border-destructive/30 bg-destructive/5', label: 'Alto' },
  medium: { color: 'border-warning/30 bg-warning/5', label: 'Médio' },
  low: { color: 'border-muted', label: 'Baixo' },
};

const ALERT_ICONS: Record<string, typeof AlertTriangle> = {
  churn: TrendingDown,
  inactive: Users,
  company: Building2,
  revenue: DollarSign,
  engagement: Activity,
};

export function BusinessAlertsWidget() {
  const { data: alerts = [], isLoading } = useBusinessAlerts();

  if (isLoading || alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Alertas de Negócio
          <Badge variant="outline" className="text-[10px] text-warning border-warning/40">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[240px]">
          <div className="space-y-2">
            {(alerts as BusinessAlert[]).slice(0, 10).map((alert, idx) => {
              const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
              const Icon = ALERT_ICONS[alert.alert_type] || AlertTriangle;

              return (
                <div
                  key={`${alert.alert_type}-${idx}`}
                  className={cn('rounded-lg border p-2.5 text-xs', config.color)}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{alert.message}</p>
                      {alert.action_required && (
                        <p className="text-muted-foreground mt-0.5">{alert.action_required}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {alert.affected_count > 0 && (
                          <span className="text-muted-foreground">
                            {alert.affected_count} {alert.affected_count === 1 ? 'registro' : 'registros'}
                          </span>
                        )}
                        <Badge variant="outline" className={cn('text-[10px]',
                          alert.severity === 'critical' ? 'text-destructive border-destructive' :
                          alert.severity === 'high' ? 'text-destructive/80' : 'text-warning'
                        )}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
