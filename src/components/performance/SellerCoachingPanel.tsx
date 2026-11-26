import { Lightbulb, Target, Trophy, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoachingSuggestions, usePerformanceBenchmark, type BenchmarkSide } from '@/hooks/useSellerCoaching';

const PRIORITY_STYLES: Record<string, string> = {
  ALTA: 'border-destructive/40 bg-destructive/10 text-destructive',
  MEDIA: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  'MÉDIA': 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  BAIXA: 'border-border bg-muted text-muted-foreground',
};

function fmtNumber(v: number | null, suffix = '') {
  if (v === null || v === undefined) return '—';
  return `${Number(v).toLocaleString('pt-BR')}${suffix}`;
}

function fmtCurrency(v: number | null) {
  if (v === null || v === undefined) return '—';
  return `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

const ROWS: Array<{ key: keyof BenchmarkSide; label: string; render: (v: number | null) => string }> = [
  { key: 'monthly_interactions', label: 'Interações no mês', render: v => fmtNumber(v) },
  { key: 'conversion_rate', label: 'Taxa de conversão', render: v => fmtNumber(v, '%') },
  { key: 'avg_ticket', label: 'Ticket médio', render: v => fmtCurrency(v) },
  { key: 'avg_cycle', label: 'Ciclo médio', render: v => fmtNumber(v, ' d') },
];

export function SellerCoachingPanel() {
  const coaching = useCoachingSuggestions();
  const benchmark = usePerformanceBenchmark();

  if (coaching.isLoading || benchmark.isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  const suggestions = coaching.data ?? [];
  const bench = benchmark.data;
  const hasTeamBase = !!bench && Object.values(bench.team_avg ?? {}).some(v => v !== null && v !== undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Coaching da semana
          </CardTitle>
          <CardDescription className="text-xs">
            Recomendações geradas a partir da sua atividade dos últimos 7 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Sem recomendações no momento</p>
              <p className="text-xs">Registre interações para receber orientações</p>
            </div>
          ) : (
            suggestions.map((s, i) => (
              <div key={`${s.area}-${i}`} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{s.area}</p>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${PRIORITY_STYLES[s.priority] ?? PRIORITY_STYLES.BAIXA}`}>
                    {s.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{s.current_status}</p>
                <p className="text-xs mt-1.5">{s.suggestion}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Comparativo com o time
          </CardTitle>
          <CardDescription className="text-xs">
            Sua posição e a média da equipe no período.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bench ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground">Posição em receita</p>
                  <p className="text-lg font-bold">{fmtNumber(bench.position?.rank_revenue)}</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground">Posição em conversão</p>
                  <p className="text-lg font-bold">{fmtNumber(bench.position?.rank_conversion)}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-3 text-[11px] font-medium text-muted-foreground">
                  <span>Métrica</span>
                  <span className="text-right">Você</span>
                  <span className="text-right">Time</span>
                </div>
                {ROWS.map(row => (
                  <div key={row.key} className="grid grid-cols-3 text-xs border-t pt-1.5">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="text-right font-medium">{row.render(bench.user_metrics?.[row.key] ?? null)}</span>
                    <span className="text-right">{row.render(bench.team_avg?.[row.key] ?? null)}</span>
                  </div>
                ))}
              </div>

              {!hasTeamBase && (
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    A média do time aparece quando houver mais de um vendedor com negócios registrados no período.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Comparativo indisponível</p>
              <p className="text-xs">O benchmark é calculado a partir dos negócios do período</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}