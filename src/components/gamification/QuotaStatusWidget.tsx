import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuotaStatus } from '@/hooks/useGamification';
import { Gauge } from 'lucide-react';

function QuotaStatusWidget() {
  const { data: quotas, isLoading } = useQuotaStatus();

  if (isLoading) return <Skeleton className="h-[200px] rounded-xl" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Status de Cotas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!quotas || quotas.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma cota configurada</p>
        ) : (
          quotas.map((q, i) => {
            const pct = Math.min(q.progress_pct ?? 0, 100);
            const statusColor = pct >= 100 ? 'bg-accent text-accent-foreground' :
              pct >= 70 ? 'bg-info/20 text-info' : 
              pct >= 40 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive';
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{q.quota_type || `Cota ${i + 1}`}</span>
                  <Badge variant="outline" className={`text-[10px] ${statusColor}`}>
                    {q.status || `${Math.round(pct)}%`}
                  </Badge>
                </div>
                <Progress value={pct} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Alcançado: {q.achieved ?? 0}</span>
                  <span>Meta: {q.target ?? 0}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(QuotaStatusWidget);
