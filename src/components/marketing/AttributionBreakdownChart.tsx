import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Allocation } from '@/hooks/useAttribution';

export function AttributionBreakdownChart({ allocations, totalValue }: { allocations: Allocation[]; totalValue: number }) {
  if (!allocations || allocations.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">Sem touchpoints registrados.</p>;
  }

  const max = Math.max(...allocations.map((a) => a.share));

  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle className="text-sm">Distribuição por touchpoint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allocations.map((a) => (
          <div key={a.touchpoint_id} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{a.type}</Badge>
                <span className="text-muted-foreground">
                  {a.source ?? '—'} · {a.medium ?? '—'} · {a.campaign ?? '—'}
                </span>
              </span>
              <span className="font-mono">
                {(a.share * 100).toFixed(1)}% · R$ {a.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-2 bg-muted/40 rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(a.share / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <div className="pt-2 border-t border-border/60 mt-3 flex justify-between text-sm font-medium">
          <span>Total atribuído</span>
          <span className="font-mono">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
