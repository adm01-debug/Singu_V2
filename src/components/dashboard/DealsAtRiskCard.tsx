import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useDealsAtRisk } from '@/hooks/useDealsAtRisk';
import { DealRiskDrawer } from '@/components/pipeline/DealRiskDrawer';
import type { PipelineDeal } from '@/hooks/usePipeline';
import { cn } from '@/lib/utils';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const levelClass = (level: 'healthy' | 'attention' | 'high') =>
  level === 'high'
    ? 'bg-destructive/15 text-destructive border-destructive/30'
    : level === 'attention'
      ? 'bg-warning/15 text-warning border-warning/30'
      : 'bg-success/15 text-success border-success/30';

export function DealsAtRiskCard() {
  const { data, isLoading } = useDealsAtRisk(5);
  const [selected, setSelected] = useState<PipelineDeal | null>(null);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
            Deals em Risco de Slip
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Nenhum deal em risco no momento. 🎉
            </p>
          )}
          {!isLoading && data && data.length > 0 && (
            <ul className="space-y-2">
              {data.map(({ deal, score, level, topFactor }) => (
                <li key={deal.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(deal)}
                    className="w-full flex items-center justify-between gap-3 p-2.5 rounded-md border border-border/50 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{deal.titulo}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {deal.company_name ?? '—'} · {formatCurrency(deal.valor || 0)} · {topFactor}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] shrink-0', levelClass(level))}>
                      {score}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <DealRiskDrawer
        deal={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </>
  );
}
