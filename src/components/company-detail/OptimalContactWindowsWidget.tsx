import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimalContactWindows } from '@/hooks/useInteractionsRpc';
import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        <p className="text-[10px] text-muted-foreground">Padrão de toda a base, não desta empresa</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {windows.slice(0, 6).map((w, i) => {
            const score = w.success_rate != null ? Math.round(Number(w.success_rate) * 100) : null;
            return (
              <div key={w.window_name} className={cn("rounded-lg p-2 text-center border", i === 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent")}>
                {i === 0 && <Star className="h-3 w-3 text-primary mx-auto mb-0.5" />}
                <p className="text-xs font-semibold">{w.window_name}</p>
                {score != null && <p className="text-[10px] text-muted-foreground">{score}% sucesso</p>}
                {w.total_interactions != null && (
                  <p className="text-[10px] text-muted-foreground">{w.total_interactions} interações</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default OptimalContactWindowsWidget;
