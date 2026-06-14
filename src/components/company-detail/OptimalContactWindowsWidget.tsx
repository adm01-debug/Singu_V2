import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimalContactWindows } from '@/hooks/useInteractionsRpc';
import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY_LABELS: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };

export const OptimalContactWindowsWidget = React.memo(function OptimalContactWindowsWidget({ companyId }: { companyId: string }) {
  const { data: windows, isLoading } = useOptimalContactWindows(companyId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Janelas de Contato</CardTitle></CardHeader><CardContent><Skeleton className="h-20" /></CardContent></Card>;
  if (!windows || windows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />Melhores Janelas de Contato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {windows.slice(0, 6).map((w, i) => {
            const day = DAY_LABELS[w.day_of_week] || String(w.day_of_week ?? '');
            const hour = w.hour != null ? `${String(w.hour).padStart(2, '0')}:00` : '';
            const score = w.success_rate != null ? Math.round(w.success_rate * 100) : null;
            return (
              <div key={i} className={cn("rounded-lg p-2 text-center border", i === 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent")}>
                {i === 0 && <Star className="h-3 w-3 text-primary mx-auto mb-0.5" />}
                <p className="text-xs font-semibold">{day} {hour}</p>
                {score != null && <p className="text-[10px] text-muted-foreground">{score}% sucesso</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default OptimalContactWindowsWidget;
