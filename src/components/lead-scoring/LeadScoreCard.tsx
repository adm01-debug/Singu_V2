import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { useLeadScore, useLeadScoreHistory, useRecomputeLead } from '@/hooks/useLeadScoring';
import { LeadGradeBadge } from './LeadGradeBadge';
import { LeadScoreBreakdown } from './LeadScoreBreakdown';
import { LeadScoreSparkline } from './LeadScoreSparkline';

interface Props {
  contactId: string;
}

function LeadScoreCardInner({ contactId }: Props) {
  const { data: score, isLoading } = useLeadScore(contactId);
  const { data: history = [] } = useLeadScoreHistory(contactId);
  const recompute = useRecomputeLead();

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Lead Score (Server)
          {score && <LeadGradeBadge grade={score.grade} size="sm" />}
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={() => recompute.mutate(contactId)} disabled={recompute.isPending}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${recompute.isPending ? 'animate-spin' : ''}`} />
          Recalcular
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!score ? (
          <p className="text-sm text-muted-foreground">Sem pontuação ainda. Clique em "Recalcular" para gerar.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{Math.round(Number(score.total_score))}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
              {Number(score.score_change ?? 0) !== 0 && (
                <span className={`text-xs ${Number(score.score_change) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Number(score.score_change) > 0 ? '+' : ''}{Math.round(Number(score.score_change))} pts
                </span>
              )}
            </div>
            <LeadScoreBreakdown score={score} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Evolução</p>
              <LeadScoreSparkline history={history} height={60} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export const LeadScoreCard = memo(LeadScoreCardInner);
