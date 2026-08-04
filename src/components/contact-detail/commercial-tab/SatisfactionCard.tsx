import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useSatisfactionTrend } from '@/hooks/useSatisfactionTrend';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const NPS_COLORS: Record<string, string> = {
  promoter: 'text-success bg-success/10',
  passive: 'text-warning bg-warning/10',
  detractor: 'text-destructive bg-destructive/10',
};

export function SatisfactionCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useSatisfactionTrend(contactId);

  const icon = <Star className="h-4 w-4 text-warning" />;

  return (
    <ExternalDataCard
      title="Satisfação & NPS"
      icon={icon}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      emptyMessage="Sem dados de satisfação disponíveis"
      onRetry={refetch}
    >
      {data && (() => {
        const TrendIcon = data.satisfaction_trend === 'up' ? TrendingUp
          : data.satisfaction_trend === 'down' ? TrendingDown
          : Minus;

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {icon}
                Satisfação & NPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {data.current_satisfaction != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">Satisfação</p>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-bold text-foreground">{data.current_satisfaction}</span>
                      <TrendIcon className={cn('h-3.5 w-3.5',
                        data.satisfaction_trend === 'up' ? 'text-success' :
                        data.satisfaction_trend === 'down' ? 'text-destructive' :
                        'text-muted-foreground'
                      )} />
                    </div>
                  </div>
                )}
                {data.current_nps != null && (
                  <div className="rounded-lg border p-2.5 text-center">
                    <p className="text-xs text-muted-foreground">NPS</p>
                    <span className="text-lg font-bold text-foreground">{data.current_nps}</span>
                    {data.nps_category && (
                      <Badge className={cn('text-[10px] ml-1', NPS_COLORS[data.nps_category] || '')} variant="outline">
                        {data.nps_category}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {data.total_surveys != null && (
                <p className="text-xs text-muted-foreground">{data.total_surveys} pesquisas respondidas</p>
              )}

              {data.nps_alert && (
                <p className="text-xs text-warning bg-warning/10 rounded-md p-2">{data.nps_alert}</p>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </ExternalDataCard>
  );
}
