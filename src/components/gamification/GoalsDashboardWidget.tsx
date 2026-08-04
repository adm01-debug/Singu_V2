import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoalsDashboard } from '@/hooks/useGamification';
import { Target, Trophy, TrendingUp, Flame } from 'lucide-react';

function GoalsDashboardWidget() {
  const { data, isLoading } = useGoalsDashboard();

  if (isLoading) return <Skeleton className="h-[120px] rounded-xl" />;

  const stats = [
    {
      label: 'Total de Metas',
      value: data?.total_goals ?? 0,
      icon: Target,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Concluídas',
      value: data?.completed_goals ?? 0,
      icon: Trophy,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'Taxa de Conclusão',
      value: `${Math.round(data?.completion_rate ?? 0)}%`,
      icon: TrendingUp,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: 'Sequência (dias)',
      value: data?.streak_days ?? 0,
      icon: Flame,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default React.memo(GoalsDashboardWidget);
