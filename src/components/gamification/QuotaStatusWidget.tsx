import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuotaStatus } from '@/hooks/useGamification';
import { Gauge } from 'lucide-react';

/**
 * Status da cota de receita do mês.
 *
 * `get_quota_status` devolve um único objeto com a meta vigente em
 * `sales_goals`: quota, achieved, remaining, pct_achieved, days_remaining,
 * daily_required, on_track e pace_pct. O widget antes lia `quota_type`,
 * `target`, `progress_pct` e `status`, nomes que a função nunca devolveu.
 */

const moeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function QuotaStatusWidget() {
  const { data: quotas, isLoading } = useQuotaStatus();

  if (isLoading) return <Skeleton className="h-[200px] rounded-xl" />;

  const cota = quotas?.[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          Status de Cotas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!cota || cota.quota === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma meta de receita vigente</p>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Receita do mês</span>
                <Badge
                  variant="outline"
                  className={
                    cota.pct_achieved >= 100 ? 'bg-accent text-accent-foreground text-[10px]'
                      : cota.on_track ? 'bg-info/20 text-info text-[10px]'
                      : 'bg-warning/20 text-warning text-[10px]'
                  }
                >
                  {cota.pct_achieved >= 100 ? 'batida' : cota.on_track ? 'no ritmo' : 'abaixo do ritmo'}
                </Badge>
              </div>
              <Progress value={Math.min(cota.pct_achieved, 100)} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Alcançado: {moeda(cota.achieved)}</span>
                <span>Meta: {moeda(cota.quota)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t">
              <div>
                <p className="text-[10px] text-muted-foreground">Falta</p>
                <p className="text-xs font-semibold">{moeda(cota.remaining)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Dias restantes</p>
                <p className="text-xs font-semibold">{cota.days_remaining}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Por dia</p>
                <p className="text-xs font-semibold">{moeda(cota.daily_required)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(QuotaStatusWidget);
