import { useInactivityAlerts } from '@/hooks/useInactivityAlerts';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BellOff, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export function InactivityAlertsCard({ contactId }: Props) {
  const { data: alerts, isLoading, error, refetch } = useInactivityAlerts(contactId);
  const active = alerts?.filter(a => !a.dismissed) || [];

  return (
    <ExternalDataCard title="Alertas de Inatividade" icon={<BellOff className="h-4 w-4" />} isLoading={isLoading} error={error} onRetry={refetch} hasData={!!alerts?.length} emptyMessage="Nenhum alerta de inatividade">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><BellOff className="h-4 w-4" /> Inatividade</span>
            {active.length > 0 && <Badge variant="destructive" className="text-[10px]">{active.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alerts?.map(alert => (
              <div key={alert.id} className={`p-2 rounded-md border border-border/50 ${alert.dismissed ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium truncate flex-1">{alert.title || alert.alert_type || 'Alerta'}</p>
                  <Badge className={`text-[9px] ml-2 ${severityColors[alert.severity || 'info'] || severityColors.info}`}>{alert.severity || 'info'}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {alert.days_inactive != null && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{alert.days_inactive} dias inativo</span>}
                  {alert.last_interaction_at && <span className="text-[10px] text-muted-foreground">Última: {format(new Date(alert.last_interaction_at), 'dd/MM/yy')}</span>}
                </div>
                {alert.description && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
