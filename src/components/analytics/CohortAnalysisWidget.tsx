import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCohortAnalysis } from '@/hooks/useReportsAnalytics';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

function retentionColor(rate: number): string {
  if (rate >= 80) return 'bg-success/80 text-success-foreground';
  if (rate >= 60) return 'bg-success/50 text-foreground';
  if (rate >= 40) return 'bg-warning/50 text-foreground';
  if (rate >= 20) return 'bg-warning/30 text-foreground';
  return 'bg-destructive/20 text-foreground';
}

export const CohortAnalysisWidget = React.memo(function CohortAnalysisWidget() {
  const { data: cohorts, isLoading, error } = useCohortAnalysis(6);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-warning" />
          <p className="text-sm">Dados de coorte indisponíveis.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-72 rounded-lg" />;
  }

  if (!cohorts || cohorts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Sem dados de coorte suficientes.</p>
        </CardContent>
      </Card>
    );
  }

  const maxMonths = Math.max(...cohorts.map(c => c.months?.length || 0));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Análise de Coorte
          <Badge variant="outline" className="text-[10px]">6 meses</Badge>
        </CardTitle>
        <CardDescription className="text-xs">Retenção de clientes por mês de aquisição</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground font-medium">Coorte</th>
                {Array.from({ length: maxMonths }).map((_, i) => (
                  <th key={i} className="text-center p-2 text-muted-foreground font-medium">M{i}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => (
                <tr key={cohort.cohort_month}>
                  <td className="p-2 font-medium whitespace-nowrap">{cohort.cohort_month}</td>
                  {cohort.months?.map((m) => (
                    <td key={m.month_number} className="p-1 text-center">
                      <div
                        className={cn(
                          'rounded px-2 py-1 text-xs font-medium',
                          retentionColor(m.retention_rate)
                        )}
                      >
                        {m.retention_rate.toFixed(0)}%
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});

export default CohortAnalysisWidget;
