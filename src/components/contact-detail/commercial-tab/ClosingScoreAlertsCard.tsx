import { Bell, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useClosingScoreAlertsView } from '@/hooks/useClosingScoreAlertsView';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'border-destructive/30 bg-destructive/5',
  medium: 'border-warning/30 bg-warning/5',
  low: 'border-muted',
};

export function ClosingScoreAlertsCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useClosingScoreAlertsView(contactId);
  const icon = <Bell className="h-4 w-4 text-warning" />;

  return (
    <ExternalDataCard
      title="Alertas de Score"
      icon={icon}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      emptyMessage="Sem alertas de score de fechamento"
      onRetry={refetch}
    >
      {data && (() => {
        const change = data.score_change ?? 0;
        const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

        return (
          <Card className={cn(PRIORITY_STYLES[data.priority || 'low'])}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {icon}
                  Alerta de Score
                </div>
                {data.temperature && (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    🌡 {data.temperature}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {data.closing_score ?? '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    <ChangeIcon className={cn('h-4 w-4',
                      change > 0 ? 'text-success' : change < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )} />
                    {change !== 0 && (
                      <span className={cn('text-xs font-medium',
                        change > 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    )}
                  </div>
                </div>
                {data.days_since_last_contact != null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {data.days_since_last_contact}d sem contato
                  </div>
                )}
              </div>

              {data.action_alert && (
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-foreground">{data.action_alert}</p>
                </div>
              )}

              {data.priority && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">Prioridade</span>
                  <Badge variant={data.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                    {data.priority === 'high' ? 'Alta' : data.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </ExternalDataCard>
  );
}
