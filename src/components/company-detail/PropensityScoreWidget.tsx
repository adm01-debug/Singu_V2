import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePropensityScore } from '@/hooks/useCompanyIntelligence';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PropensityScoreWidget = React.memo(function PropensityScoreWidget({ companyId }: { companyId: string }) {
  const { data: score, isLoading } = usePropensityScore(companyId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Propensão</CardTitle></CardHeader><CardContent><Skeleton className="h-16" /></CardContent></Card>;
  if (score == null) return null;

  const numericScore = typeof score === 'number' ? score : Number(score) || 0;
  const pct = Math.round(numericScore * 100);
  const level = pct >= 70 ? 'Alta' : pct >= 40 ? 'Média' : 'Baixa';
  const color = pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-destructive';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Zap className={cn("h-4 w-4", color)} />Propensão de Compra</span>
          <Badge variant="outline" className={cn("text-[10px]", color)}>{level}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span className={cn("text-2xl font-bold", color)}>{pct}%</span>
          <Progress value={pct} className="h-2 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
});

export default PropensityScoreWidget;
