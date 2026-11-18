import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Timer, ShieldCheck, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Observabilidade do sistema.
 *
 * Esta página existia no repositório sem rota e não abria: consultava
 * `captured_at` e `avg_latency_ms` em `system_health_snapshots`, colunas que
 * não existem (a tabela tem `timestamp` e `total_latency_ms`), então a query
 * estourava. Os três cartões do topo também eram número fixo no código
 * (99.9%, 142ms, 0.02%).
 *
 * O que o banco sustenta hoje: `system_health_snapshots` registra a execução
 * do cron de monitoramento (status + carimbo), e `total_latency_ms` vem nulo
 * em todas as linhas — por isso não há gráfico de latência aqui. O que existe
 * de verdade é a disponibilidade do monitoramento e as queries lentas
 * (`slow_queries_audit`).
 */

const JANELA_DIAS = 7;

interface SlowQuery {
  query: string;
  calls: number;
  mean_exec_ms: number | null;
}

interface Snapshot {
  timestamp: string;
  status: string | null;
}

function diaCurto(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Observability() {
  const { data: snapshots, isLoading: carregandoSnapshots, error: erroSnapshots } = useQuery<Snapshot[]>({
    queryKey: ['system-health-snapshots', JANELA_DIAS],
    queryFn: async () => {
      const desde = new Date(Date.now() - JANELA_DIAS * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('system_health_snapshots')
        .select('timestamp, status')
        .gte('timestamp', desde)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Snapshot[];
    },
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: slowQueries, isLoading: carregandoQueries } = useQuery<SlowQuery[]>({
    queryKey: ['slow-queries-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slow_queries_audit')
        .select('query, calls, mean_exec_ms')
        .order('mean_exec_ms', { ascending: false })
        .limit(10);
      if (error) return []; // extensão pg_stat_statements pode estar desligada
      return (data ?? []) as unknown as SlowQuery[];
    },
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  const total = snapshots?.length ?? 0;
  const saudaveis = (snapshots ?? []).filter(s => s.status === 'healthy').length;
  const disponibilidade = total === 0 ? null : Math.round((saudaveis / total) * 1000) / 10;

  const ultimo = snapshots?.[0]?.timestamp ?? null;
  const minutosDesdeUltimo = ultimo
    ? Math.round((Date.now() - new Date(ultimo).getTime()) / 60000)
    : null;

  const queriesLentas = slowQueries ?? [];
  const piorMedia = queriesLentas.reduce((pior, q) => Math.max(pior, q.mean_exec_ms ?? 0), 0);

  // Batimento do monitoramento: quantas verificações entraram por dia.
  const porDia = Object.entries(
    (snapshots ?? []).reduce<Record<string, number>>((acc, s) => {
      const d = diaCurto(s.timestamp);
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([dia, verificacoes]) => ({ dia, verificacoes }))
    .reverse();

  return (
    <AppLayout title="Observabilidade">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Observabilidade do Sistema</h1>
            <p className="text-sm text-muted-foreground">Últimos {JANELA_DIAS} dias</p>
          </div>
          <Activity className="text-primary" />
        </div>

        {erroSnapshots && (
          <Card className="border-destructive/40">
            <CardContent className="pt-6 text-sm text-destructive">
              Não foi possível ler o histórico de monitoramento.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verificações saudáveis</CardTitle>
              <ShieldCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              {carregandoSnapshots ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {disponibilidade === null ? '—' : `${disponibilidade}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {total === 0 ? 'Nenhuma verificação registrada' : `${saudaveis} de ${total} verificações`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Última verificação</CardTitle>
              <Timer className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {carregandoSnapshots ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {minutosDesdeUltimo === null ? '—' : `há ${minutosDesdeUltimo} min`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ultimo ? new Date(ultimo).toLocaleString('pt-BR') : 'O monitoramento não registrou nada'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pior query (tempo médio)</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              {carregandoQueries ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {queriesLentas.length === 0 ? '—' : `${piorMedia.toFixed(0)}ms`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {queriesLentas.length === 0
                      ? 'Sem amostragem de queries lentas'
                      : `${queriesLentas.length} queries sob observação`}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queries mais lentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 overflow-y-auto max-h-[300px]">
              {carregandoQueries && <Skeleton className="h-20 w-full" />}
              {!carregandoQueries && queriesLentas.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma query lenta registrada.</p>
              )}
              {queriesLentas.map(q => (
                <div key={q.query} className="p-3 rounded-lg bg-muted/30 border text-xs font-mono">
                  <div className="flex justify-between mb-1">
                    <span className="text-primary">Chamadas: {q.calls}</span>
                    <span className="text-warning">Média: {(q.mean_exec_ms ?? 0).toFixed(2)}ms</span>
                  </div>
                  <p className="truncate opacity-70">{q.query}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batimento do monitoramento</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {carregandoSnapshots ? (
              <Skeleton className="h-full w-full" />
            ) : porDia.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma verificação nos últimos {JANELA_DIAS} dias.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porDia}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="dia" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--primary))' }}
                  />
                  <Bar dataKey="verificacoes" name="Verificações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
