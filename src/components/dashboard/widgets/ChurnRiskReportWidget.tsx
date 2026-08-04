import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useChurnRiskReport } from '@/hooks/useReportsAnalytics';
import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const RISK_COLORS: Record<string, string> = {
  critical: 'text-destructive', high: 'text-destructive',
  medium: 'text-warning', low: 'text-success',
};

export const ChurnRiskReportWidget = React.memo(function ChurnRiskReportWidget() {
  const { data: report, isLoading } = useChurnRiskReport();

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Relatório Churn</CardTitle></CardHeader><CardContent><Skeleton className="h-28" /></CardContent></Card>;
  if (!report || report.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-destructive" />Relatório de Churn
          <Badge variant="outline" className="text-[10px] ml-auto">{report.length} registros</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {report.slice(0, 8).map((item, i) => {
            const risk = String(item.risk_level || item.level || 'medium').toLowerCase();
            const name = String(item.company_name || item.contact_name || item.name || `#${i + 1}`);
            const score = item.score != null ? Number(item.score) : null;
            return (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{name}</p>
                  {item.reason && <p className="text-[10px] text-muted-foreground truncate">{String(item.reason)}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {score != null && <span className={cn("text-xs font-bold tabular-nums", RISK_COLORS[risk])}>{score}%</span>}
                  <Badge variant="outline" className={cn("text-[9px] capitalize", RISK_COLORS[risk])}>{risk}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default ChurnRiskReportWidget;
