import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyInsights } from '@/hooks/useReportsAnalytics';
import { Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const DailyInsightsWidget = React.memo(function DailyInsightsWidget() {
  const { data, isLoading } = useDailyInsights();

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Insights do Dia</CardTitle></CardHeader><CardContent><Skeleton className="h-28" /></CardContent></Card>;
  if (!data) return null;

  const insights = data as Record<string, unknown>;
  const summary = (insights.summary as string) || '';
  const highlights = (insights.highlights as string[]) || [];
  const trend = String(insights.trend || 'stable');
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-warning" />Insights do Dia</span>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
        {highlights.length > 0 && (
          <ul className="space-y-1">
            {highlights.slice(0, 4).map((h, i) => (
              <li key={i} className="text-xs flex items-start gap-1.5">
                <span className="text-warning mt-0.5">💡</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
        {insights.score != null && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">Score: {String(insights.score)}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default DailyInsightsWidget;
