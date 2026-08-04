import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserGoals } from '@/hooks/useGamification';
import { Target, CheckCircle2, Clock } from 'lucide-react';

function UserGoalsWidget() {
  const { data: goals, isLoading } = useUserGoals();

  if (isLoading) return <Skeleton className="h-[200px] rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Minhas Metas
          {goals && goals.length > 0 && (
            <Badge variant="outline" className="text-[10px] ml-auto">{goals.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(!goals || goals.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma meta ativa</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {goals.map((goal, i) => {
              const pct = Math.min(goal.progress_pct ?? 0, 100);
              const isComplete = goal.status === 'completed' || pct >= 100;
              return (
                <div key={goal.id || i} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-start gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{goal.title || `Meta ${i + 1}`}</p>
                      {goal.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{goal.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground">{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  {goal.end_date && (
                    <p className="text-[9px] text-muted-foreground">
                      Prazo: {new Date(goal.end_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(UserGoalsWidget);
