import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAiGatewayHealth } from '@/hooks/useAiGatewayHealth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function fmtMs(v: number | null | undefined): string {
  if (v == null) return '—';
  return v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`;
}

function toneForError(pct: number | null | undefined): 'success' | 'warning' | 'destructive' {
  if (pct == null) return 'success';
  if (pct >= 5) return 'destructive';
  if (pct >= 1) return 'warning';
  return 'success';
}

export function AiGatewayHealthCard() {
  const { data, isLoading, error } = useAiGatewayHealth(24);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4" />
          Saúde do Lovable AI Gateway (24h)
          {data && data.active_alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2 gap-1">
              <ShieldAlert className="w-3 h-3" />
              {data.active_alerts.length} alerta{data.active_alerts.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Skeleton className="h-24 w-full" />}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Falha ao carregar métricas</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            {data.active_alerts.length > 0 && (
              <div className="space-y-2">
                {data.active_alerts.slice(0, 3).map((alert) => (
                  <Alert
                    key={alert.id}
                    variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between gap-2">
                      <span>{alert.title}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </AlertTitle>
                    {alert.message && <AlertDescription>{alert.message}</AlertDescription>}
                  </Alert>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Requests</div>
                <div className="text-2xl font-bold">{data.totals?.requests ?? 0}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Taxa de erro</div>
                <div className={`text-2xl font-bold text-${toneForError(data.totals?.error_rate_pct)}`}>
                  {data.totals?.error_rate_pct != null ? `${data.totals.error_rate_pct}%` : '—'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Latência p95</div>
                <div className="text-2xl font-bold">{fmtMs(data.totals?.p95_ms)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Latência p99</div>
                <div className="text-2xl font-bold">{fmtMs(data.totals?.p99_ms)}</div>
              </div>
            </div>

            {data.by_function.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma chamada registrada nas últimas 24h. Instrumente edge functions com{' '}
                <code>logAiGatewayCall()</code> para popular este painel.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b">
                    <tr className="[&>th]:text-left [&>th]:py-2 [&>th]:pr-4">
                      <th>Função</th>
                      <th className="text-right">Requests</th>
                      <th className="text-right">Erros</th>
                      <th className="text-right">Taxa</th>
                      <th className="text-right">p50</th>
                      <th className="text-right">p95</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_function.map((row) => {
                      const tone = toneForError(row.error_rate_pct);
                      return (
                        <tr key={row.function_name} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-medium">{row.function_name}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{row.requests}</td>
                          <td className="py-2 pr-4 text-right tabular-nums">{row.errors}</td>
                          <td className="py-2 pr-4 text-right">
                            <Badge
                              variant={tone === 'destructive' ? 'destructive' : tone === 'warning' ? 'secondary' : 'outline'}
                            >
                              {row.error_rate_pct != null ? `${row.error_rate_pct}%` : '—'}
                            </Badge>
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">{fmtMs(row.p50_ms)}</td>
                          <td className="py-2 text-right tabular-nums">{fmtMs(row.p95_ms)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {data.by_model.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                  Desempenho por modelo
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground border-b">
                      <tr className="[&>th]:text-left [&>th]:py-2 [&>th]:pr-4">
                        <th>Modelo</th>
                        <th className="text-right">Requests</th>
                        <th className="text-right">Taxa erro</th>
                        <th className="text-right">p95</th>
                        <th className="text-right">Tokens in</th>
                        <th className="text-right">Tokens out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_model.map((row) => {
                        const tone = toneForError(row.error_rate_pct);
                        return (
                          <tr key={row.model} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium truncate max-w-[220px]">{row.model}</td>
                            <td className="py-2 pr-4 text-right tabular-nums">{row.requests}</td>
                            <td className="py-2 pr-4 text-right">
                              <Badge
                                variant={
                                  tone === 'destructive'
                                    ? 'destructive'
                                    : tone === 'warning'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {row.error_rate_pct != null ? `${row.error_rate_pct}%` : '—'}
                              </Badge>
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums">{fmtMs(row.p95_ms)}</td>
                            <td className="py-2 pr-4 text-right tabular-nums">
                              {row.tokens_in.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-2 text-right tabular-nums">
                              {row.tokens_out.toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}