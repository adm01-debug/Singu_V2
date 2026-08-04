import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useContactEngagement } from '@/hooks/useContactEngagement';
import { cn } from '@/lib/utils';

interface Props { contactId: string; }

const TREND_ICON = {
  rising: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
} as const;

const TREND_COLOR = {
  rising: 'text-green-500',
  stable: 'text-muted-foreground',
  declining: 'text-destructive',
};

const LEVEL_COLOR: Record<string, string> = {
  alto: 'bg-green-500/10 text-green-700 border-green-500/30',
  medio: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
  baixo: 'bg-red-500/10 text-red-700 border-red-500/30',
  high: 'bg-green-500/10 text-green-700 border-green-500/30',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
  low: 'bg-red-500/10 text-red-700 border-red-500/30',
};

export function EngagementScoreWidget({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useContactEngagement(contactId);

  return (
    <ExternalDataCard
      title="Engajamento"
      icon={<Activity className="h-4 w-4 text-primary" />}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      hasData={!!data}
      emptyMessage="Dados insuficientes para calcular engajamento"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Engajamento
            </span>
            <div className="flex items-center gap-1.5">
              {data?.trend && (() => {
                const TrendIcon = TREND_ICON[data.trend];
                return <TrendIcon className={cn('h-3.5 w-3.5', TREND_COLOR[data.trend])} />;
              })()}
              <Badge variant="outline" className={cn('text-[10px]', LEVEL_COLOR[data?.level?.toLowerCase() || ''])}>
                {data?.level}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tabular-nums">{data?.score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <Progress value={data?.score || 0} className="flex-1 h-2" />
          </div>

          {data?.factors && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.factors).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground capitalize">{key === 'recency' ? 'Recência' : key === 'frequency' ? 'Frequência' : key === 'depth' ? 'Profundidade' : 'Responsividade'}</span>
                    <span className="tabular-nums font-medium">{value}</span>
                  </div>
                  <Progress value={value} className="h-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
