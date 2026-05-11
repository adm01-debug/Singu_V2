import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useRelationshipScoreHistory } from '@/hooks/useRelationshipScoreHistory';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

interface Props {
  contactId: string;
}

export function RelationshipScoreChart({ contactId }: Props) {
  const { data: history = [], isLoading, error, refetch } = useRelationshipScoreHistory(contactId);

  const chartData = useMemo(() => {
    return history.map(entry => ({
      date: format(parseISO(entry.created_at), 'dd/MM'),
      score: entry.score,
      engagement: entry.engagement_score ?? 0,
      sentiment: entry.sentiment_score ?? 0,
      responsiveness: entry.responsiveness_score ?? 0,
    }));
  }, [history]);

  const trend = useMemo(() => {
    if (history.length < 2) return null;
    const first = history[0].score;
    const last = history[history.length - 1].score;
    const diff = last - first;
    return { diff, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable' };
  }, [history]);

  const icon = <TrendingUp className="h-4 w-4 text-primary" />;

  return (
    <ExternalDataCard
      title="Evolução do Score"
      icon={icon}
      isLoading={isLoading}
      error={error}
      hasData={chartData.length >= 2}
      emptyMessage="Dados insuficientes para gráfico de evolução"
      onRetry={refetch}
      skeletonHeight="h-48"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2">
              {icon}
              Evolução do Score de Relacionamento
            </div>
            {trend && (
              <Badge
                variant={trend.direction === 'up' ? 'default' : trend.direction === 'down' ? 'destructive' : 'secondary'}
                className="text-[10px]"
              >
                {trend.diff > 0 ? '+' : ''}{trend.diff} pts
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            {history.length} registros de evolução
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
               <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#scoreGradient)" strokeWidth={2} name="Score" />
               <Area type="monotone" dataKey="engagement" stroke="hsl(var(--success))" fill="url(#engagementGradient)" strokeWidth={1.5} name="Engajamento" strokeDasharray="4 2" />
               <Area type="monotone" dataKey="sentiment" stroke="#f59e0b" fill="transparent" strokeWidth={1} name="Sentimento" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
