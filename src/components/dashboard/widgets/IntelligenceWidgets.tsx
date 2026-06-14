import { Clock, AlertTriangle, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTodaysReminders } from '@/hooks/useTodaysReminders';
import { useActiveAlerts } from '@/hooks/useActiveAlerts';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'border-destructive/30 bg-destructive/5',
  medium: 'border-warning/30 bg-warning/5',
  low: 'border-muted',
  critical: 'border-destructive bg-destructive/10',
};

export function TodaysRemindersWidget() {
  const { data: reminders = [] } = useTodaysReminders();

  if (reminders.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary" />
          Lembretes de Hoje
          <Badge variant="secondary" className="text-[10px]">{reminders.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {reminders.slice(0, 8).map((r) => (
              <div
                key={r.id}
                className={cn(
                  'rounded-lg border p-2.5 text-xs',
                  PRIORITY_COLORS[r.priority || 'low'] || PRIORITY_COLORS.low
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{r.title}</p>
                    {r.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1">{r.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {r.contact_name && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <User className="h-3 w-3" /> {r.contact_name}
                        </span>
                      )}
                      {r.company_name && (
                        <span className="flex items-center gap-0.5 text-muted-foreground">
                          <Building2 className="h-3 w-3" /> {r.company_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {r.time_status && (
                      <Badge variant="outline" className="text-[10px]">{r.time_status}</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function ActiveAlertsWidget() {
  const { data: alerts = [] } = useActiveAlerts();

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Alertas Ativos
          <Badge variant="destructive" className="text-[10px]">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2">
            {alerts.slice(0, 8).map((a) => (
              <div
                key={a.id}
                className={cn(
                  'rounded-lg border p-2.5 text-xs',
                  PRIORITY_COLORS[a.severity || 'low'] || PRIORITY_COLORS.low
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {a.type_label && (
                      <Badge variant="outline" className="text-[10px] mb-1">{a.type_label}</Badge>
                    )}
                    {a.contact_name && (
                      <p className="font-medium text-foreground">{a.contact_name}</p>
                    )}
                    {a.urgency_reason && (
                      <p className="text-muted-foreground mt-0.5">{a.urgency_reason}</p>
                    )}
                    {a.days_inactive != null && (
                      <p className="text-muted-foreground">{a.days_inactive} dias inativo</p>
                    )}
                  </div>
                  {a.severity_label && (
                    <Badge variant="outline" className={cn('text-[10px]',
                      a.severity === 'critical' ? 'text-destructive border-destructive' :
                      a.severity === 'high' ? 'text-destructive' :
                      'text-warning'
                    )}>
                      {a.severity_label}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
