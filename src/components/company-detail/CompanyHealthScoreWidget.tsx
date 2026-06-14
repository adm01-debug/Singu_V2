import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyHealthScore } from '@/hooks/useCompanyIntelligence';
import { HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVEL_CONFIG: Record<string, { color: string; badge: string }> = {
  excellent: { color: 'text-success', badge: 'bg-success/10 text-success border-success/30' },
  good: { color: 'text-success', badge: 'bg-success/10 text-success border-success/30' },
  average: { color: 'text-warning', badge: 'bg-warning/10 text-warning border-warning/30' },
  poor: { color: 'text-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
  critical: { color: 'text-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export const CompanyHealthScoreWidget = React.memo(function CompanyHealthScoreWidget({ companyId }: { companyId: string }) {
  const { data, isLoading } = useCompanyHealthScore(companyId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Health Score</CardTitle></CardHeader><CardContent><Skeleton className="h-28" /></CardContent></Card>;
  if (!data) return null;

  const level = (data.level || 'average').toLowerCase();
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.average;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><HeartPulse className={cn("h-4 w-4", config.color)} />Health Score</span>
          <Badge variant="outline" className={cn("text-[10px] capitalize", config.badge)}>{data.level}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <span className={cn("text-3xl font-bold", config.color)}>{data.score}</span>
          <Progress value={data.score} className="h-2 flex-1" />
        </div>
        {data.factors && Object.keys(data.factors).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Fatores</p>
            {Object.entries(data.factors).slice(0, 5).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium tabular-nums">{val}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default CompanyHealthScoreWidget;
