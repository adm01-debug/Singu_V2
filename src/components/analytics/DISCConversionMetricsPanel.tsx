import { BarChart3, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useDISCConversionMetrics } from '@/hooks/useDISCConversionMetrics';
import { useEdgeFunctionActions } from '@/hooks/useEdgeFunctionActions';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISC_COLORS: Record<string, string> = {
  D: 'text-destructive',
  I: 'text-warning',
  S: 'text-success',
  C: 'text-info',
};

export function DISCConversionMetricsPanel() {
  const { metrics, loading, bestProfile, overallConversionRate } = useDISCConversionMetrics();
  const { runRFMAnalyzer, loading: actionLoading } = useEdgeFunctionActions();

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-primary" />
            Conversão por Perfil DISC
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => runRFMAnalyzer()} disabled={actionLoading['rfm-analyzer']}>
            {actionLoading['rfm-analyzer'] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '📊'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {metrics.length > 0 ? (
          <div className="space-y-3">
            {/* Overall */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa geral de conversão</span>
              <span className="font-bold text-foreground">{overallConversionRate}%</span>
            </div>

            {/* Best profile */}
            {bestProfile && (
              <div className="flex items-center gap-2 rounded-lg border bg-success/5 p-2">
                <Trophy className="h-4 w-4 text-success" />
                <span className="text-xs text-foreground">
                  Melhor perfil: <strong className={DISC_COLORS[bestProfile.disc_profile]}>{bestProfile.disc_profile}</strong>
                  {bestProfile.blend_profile && ` (${bestProfile.blend_profile})`}
                  — {Number(bestProfile.conversion_rate || 0).toFixed(0)}% conversão
                </span>
              </div>
            )}

            {/* Per-profile breakdown */}
            <div className="space-y-2">
              {metrics.map(m => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('font-bold', DISC_COLORS[m.disc_profile])}>{m.disc_profile}</span>
                      {m.blend_profile && <Badge variant="outline" className="text-[9px]">{m.blend_profile}</Badge>}
                      <span className="text-muted-foreground">{m.total_contacts} contatos</span>
                    </div>
                    <span className="font-medium text-foreground">{Number(m.conversion_rate || 0).toFixed(0)}%</span>
                  </div>
                  <Progress value={Number(m.conversion_rate || 0)} className="h-1.5" />
                  <div className="flex gap-3 text-[10px] text-muted-foreground">
                    <span>✅ {m.converted_count} convertidos</span>
                    <span>❌ {m.lost_count} perdidos</span>
                    {m.average_sales_cycle_days && <span>⏱ {m.average_sales_cycle_days}d ciclo</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhum dado de conversão DISC</p>
        )}
      </CardContent>
    </Card>
  );
}
