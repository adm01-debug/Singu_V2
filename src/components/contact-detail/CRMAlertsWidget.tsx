import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCRMAlerts } from '@/hooks/useCRMAlerts';
import { AlertCircle, CheckCircle2, TrendingDown, Clock, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

const SEVERITY_CONFIG = {
  high: 'bg-red-500/10 text-red-600 border-red-200',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-200',
  low: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

export function CRMAlertsWidget({ contactId }: Props) {
  const { alerts, isLoading, resolveAlert } = useCRMAlerts(contactId);

  if (isLoading || alerts.length === 0) return null;

  return (
    <Card className="border-red-200/50 bg-red-50/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          Alertas de Atenção ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={cn(
              "p-3 rounded-lg border flex flex-col gap-2 transition-all",
              SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {alert.type === 'at_risk' ? <TrendingDown className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                <p className="text-sm font-semibold">{alert.type === 'at_risk' ? 'Risco de Churn' : 'Inatividade'}</p>
              </div>
              <span className="text-[10px] opacity-70">
                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            
            <p className="text-xs leading-relaxed">{alert.message}</p>
            
            {alert.suggested_action && (
              <div className="bg-white/50 p-2 rounded text-[11px] border border-current/10 mt-1">
                <p className="flex items-center gap-1.5 font-medium mb-1">
                  <Lightbulb className="h-3 w-3" /> Ação Sugerida:
                </p>
                {alert.suggested_action}
              </div>
            )}
            
            <div className="flex justify-end mt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[11px] gap-1 hover:bg-white/30"
                onClick={() => resolveAlert(alert.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Marcar como resolvido
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
