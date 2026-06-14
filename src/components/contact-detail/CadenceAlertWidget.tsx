import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactCadence } from '@/hooks/useContactCadence';
import { Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Bell; label: string }> = {
  overdue: { color: 'text-destructive', icon: AlertTriangle, label: 'Atrasado' },
  due_today: { color: 'text-warning', icon: Clock, label: 'Hoje' },
  due_soon: { color: 'text-info', icon: Bell, label: 'Em breve' },
  on_track: { color: 'text-success', icon: CheckCircle, label: 'Em dia' },
};

export const CadenceAlertWidget = React.memo(function CadenceAlertWidget() {
  const { alerts, loading } = useContactCadence();

  if (loading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Cadência</CardTitle></CardHeader><CardContent><Skeleton className="h-20" /></CardContent></Card>;
  if (alerts.length === 0) return null;

  return (
    <Card className="border-warning/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-warning" />Alertas de Cadência
          <Badge variant="outline" className="text-[10px] ml-auto text-warning border-warning/30">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {alerts.slice(0, 5).map((alert) => {
            const config = STATUS_CONFIG[alert.status] || STATUS_CONFIG.on_track;
            const Icon = config.icon;
            return (
              <div key={alert.cadence.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{alert.contact?.first_name} {alert.contact?.last_name}</p>
                  {alert.company?.name && <p className="text-[10px] text-muted-foreground truncate">{alert.company.name}</p>}
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className={cn("text-[9px]", config.color)}>{config.label}</Badge>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{alert.daysOverdue}d</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default CadenceAlertWidget;
