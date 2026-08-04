import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';
import { Bell, AlertTriangle, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  high: { icon: AlertTriangle, color: 'text-destructive' },
  medium: { icon: Clock, color: 'text-warning' },
  low: { icon: Info, color: 'text-muted-foreground' },
};

export const PendingNotificationsWidget = React.memo(function PendingNotificationsWidget() {
  const { data: notifications, isLoading } = usePendingNotifications(10);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Notificações</CardTitle></CardHeader><CardContent><Skeleton className="h-28" /></CardContent></Card>;
  if (!notifications || notifications.length === 0) return null;

  return (
    <Card className="border-warning/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4 text-warning" />Notificações Pendentes
          <Badge variant="outline" className="text-[10px] ml-auto text-warning border-warning/30">{notifications.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {notifications.map((n, i) => {
            const config = PRIORITY_CONFIG[n.priority || 'low'] || PRIORITY_CONFIG.low;
            const Icon = config.icon;
            return (
              <div key={n.id || i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{n.title || n.notification_type}</p>
                  {n.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{n.description}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    {n.contact_name && <span className="text-[9px] text-muted-foreground">{n.contact_name}</span>}
                    {n.company_name && <span className="text-[9px] text-muted-foreground">• {n.company_name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default PendingNotificationsWidget;
