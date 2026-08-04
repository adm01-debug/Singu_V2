import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useChurnPredictions } from '@/hooks/useChurnRisk';
import { TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ChurnPredictionsWidget = React.memo(function ChurnPredictionsWidget({ contactId }: { contactId: string }) {
  const { data: predictions, isLoading } = useChurnPredictions(contactId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Predições de Churn</CardTitle></CardHeader><CardContent><Skeleton className="h-28" /></CardContent></Card>;
  if (!predictions || predictions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-destructive" />Predições de Churn
          <Badge variant="outline" className="text-[10px] ml-auto">{predictions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {predictions.map((pred, i) => {
          const prob = pred.churn_probability != null ? Math.round(pred.churn_probability * 100) : null;
          const color = prob != null ? (prob >= 70 ? 'text-destructive' : prob >= 40 ? 'text-warning' : 'text-success') : 'text-muted-foreground';
          return (
            <div key={pred.id || i} className="p-2 rounded-lg bg-muted/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-bold tabular-nums", color)}>{prob != null ? `${prob}%` : '-'}</span>
                {pred.created_at && <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(pred.created_at), "dd/MM", { locale: ptBR })}</span>}
              </div>
              {prob != null && <Progress value={prob} className="h-1.5" />}
              {pred.confidence_level && <p className="text-[10px] text-muted-foreground line-clamp-1">Confiança: {pred.confidence_level}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
});

export default ChurnPredictionsWidget;
