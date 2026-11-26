import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, Brain, Cpu, Sparkles, Target } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCatalogoModelos, useReframes, useScriptsRecomendados } from '@/hooks/useGovernancaIA';

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

const formatCusto = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  return `US$ ${value.toFixed(value < 0.1 ? 3 : 2)}`;
};

const formatContexto = (value: number | null | undefined) => {
  if (!value) return '—';
  return value >= 1000 ? `${formatNumber(Math.round(value / 1000))}k` : formatNumber(value);
};

const formatPct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${Number(value).toFixed(0)}%`;

const TIER_LABEL: Record<string, string> = {
  embedding: 'Embedding',
  reranker: 'Reranker',
  nano: 'Nano',
  fast: 'Rápido',
  premium: 'Premium',
  flagship: 'Flagship',
};

const CUSTO_TIER_CLASSE: Record<string, string> = {
  'ultra-low': 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400',
  low: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  medium: 'border-amber-500/60 text-amber-600 dark:text-amber-400',
  high: 'border-orange-500/60 text-orange-600 dark:text-orange-400',
  premium: 'border-destructive/60 text-destructive',
};

function ErroCard({ titulo, erro }: { titulo: string; erro: unknown }) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex items-start gap-3 py-6">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-foreground">Não foi possível carregar {titulo}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {erro instanceof Error ? erro.message : 'Erro desconhecido'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GovernancaIA() {
  const [aba, setAba] = useState('modelos');
  const modelos = useCatalogoModelos();
  const reframes = useReframes();
  const scripts = useScriptsRecomendados();

  const catalogo = useMemo(() => modelos.data ?? [], [modelos.data]);
  const reframesRows = useMemo(() => reframes.data ?? [], [reframes.data]);
  const scriptsRows = useMemo(() => scripts.data ?? [], [scripts.data]);

  const kpis = useMemo(() => {
    const provedores = new Set(catalogo.map((linha) => linha.provider).filter(Boolean));
    const baratos = catalogo.filter((linha) => linha.cost_tier === 'ultra-low').length;
    const efetivos = reframesRows.filter((linha) => (linha.effectiveness_score ?? 0) >= 80).length;
    return [
      { titulo: 'Modelos no catálogo', valor: formatNumber(catalogo.length), icone: Cpu, detalhe: `${provedores.size} provedores` },
      { titulo: 'Custo ultra-baixo', valor: formatNumber(baratos), icone: Sparkles, detalhe: 'candidatos a alto volume' },
      { titulo: 'Reframes altamente efetivos', valor: formatNumber(efetivos), icone: Target, detalhe: `de ${formatNumber(reframesRows.length)} técnicas` },
      { titulo: 'Scripts mapeados', valor: formatNumber(scriptsRows.length), icone: Brain, detalhe: 'com taxa de sucesso registrada' },
    ];
  }, [catalogo, reframesRows, scriptsRows]);

  const atualizando = modelos.isFetching || reframes.isFetching || scripts.isFetching;

  const recarregar = () => {
    void modelos.refetch();
    void reframes.refetch();
    void scripts.refetch();
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Governança de IA | SINGU</title>
        <meta
          name="description"
          content="Catálogo de modelos de IA com custo por milhão de tokens, técnicas de reframe e scripts recomendados por performance."
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Governança de IA</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quais modelos o sistema pode usar, quanto cada um custa e quais técnicas e scripts têm melhor desempenho.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={recarregar} disabled={atualizando}>
            {atualizando ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.titulo}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
                <kpi.icone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {modelos.isLoading || reframes.isLoading || scripts.isLoading
                    ? <Skeleton className="h-7 w-16" />
                    : kpi.valor}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.detalhe}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={aba} onValueChange={setAba}>
          <TabsList>
            <TabsTrigger value="modelos">Catálogo de modelos</TabsTrigger>
            <TabsTrigger value="reframes">Reframes</TabsTrigger>
            <TabsTrigger value="scripts">Scripts recomendados</TabsTrigger>
          </TabsList>

          <TabsContent value="modelos" className="mt-4">
            {modelos.error ? (
              <ErroCard titulo="o catálogo de modelos" erro={modelos.error} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Modelos disponíveis ({formatNumber(catalogo.length)})</CardTitle>
                </CardHeader>
                <CardContent>
                  {modelos.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 8 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
                    </div>
                  ) : catalogo.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum modelo cadastrado.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tier</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Provedor</TableHead>
                            <TableHead className="text-right">Entrada /1M</TableHead>
                            <TableHead className="text-right">Saída /1M</TableHead>
                            <TableHead className="text-right">Contexto</TableHead>
                            <TableHead>Faixa de custo</TableHead>
                            <TableHead>Capacidades</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {catalogo.map((linha) => (
                            <TableRow key={`${linha.tier}-${linha.model}`}>
                              <TableCell>
                                <Badge variant="secondary">{TIER_LABEL[linha.tier ?? ''] ?? linha.tier ?? '—'}</Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{linha.model ?? '—'}</TableCell>
                              <TableCell>{linha.provider ?? '—'}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatCusto(linha.cost_input)}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatCusto(linha.cost_output)}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatContexto(linha.context_window)}</TableCell>
                              <TableCell>
                                {linha.cost_tier ? (
                                  <Badge variant="outline" className={CUSTO_TIER_CLASSE[linha.cost_tier]}>
                                    {linha.cost_tier}
                                  </Badge>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(linha.capabilities ?? []).map((capacidade) => (
                                    <Badge key={capacidade} variant="outline" className="text-xs">{capacidade}</Badge>
                                  ))}
                                  {(linha.capabilities ?? []).length === 0 ? '—' : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reframes" className="mt-4">
            {reframes.error ? (
              <ErroCard titulo="as técnicas de reframe" erro={reframes.error} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Técnicas de quebra de objeção ({formatNumber(reframesRows.length)})</CardTitle>
                </CardHeader>
                <CardContent>
                  {reframes.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 6 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
                    </div>
                  ) : reframesRows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma técnica cadastrada.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Técnica</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Efetividade</TableHead>
                            <TableHead>Situação</TableHead>
                            <TableHead>Dificuldade</TableHead>
                            <TableHead>Perfis DISC compatíveis</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reframesRows.map((linha) => (
                            <TableRow key={`${linha.pattern_id}-${linha.pattern_name}`}>
                              <TableCell className="font-medium">
                                {linha.pattern_name ?? '—'}
                                {linha.example_objection ? (
                                  <p className="mt-1 text-xs text-muted-foreground">“{linha.example_objection}”</p>
                                ) : null}
                              </TableCell>
                              <TableCell>{linha.category ?? '—'}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatPct(linha.effectiveness_score)}</TableCell>
                              <TableCell>{linha.effectiveness_status ?? '—'}</TableCell>
                              <TableCell>{linha.difficulty_level ?? '—'}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(linha.disc_compatibility ?? []).map((perfil) => (
                                    <Badge key={perfil} variant="outline" className="text-xs">{perfil}</Badge>
                                  ))}
                                  {(linha.disc_compatibility ?? []).length === 0 ? '—' : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="scripts" className="mt-4">
            {scripts.error ? (
              <ErroCard titulo="os scripts recomendados" erro={scripts.error} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scripts por desempenho ({formatNumber(scriptsRows.length)})</CardTitle>
                </CardHeader>
                <CardContent>
                  {scripts.isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
                    </div>
                  ) : scriptsRows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum script cadastrado.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Script</TableHead>
                            <TableHead>Etapa</TableHead>
                            <TableHead>Canal</TableHead>
                            <TableHead className="text-right">Sucesso</TableHead>
                            <TableHead className="text-right">Usos</TableHead>
                            <TableHead className="text-right">Duração</TableHead>
                            <TableHead>Situação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scriptsRows.map((linha) => (
                            <TableRow key={`${linha.script_id}-${linha.script_name}`}>
                              <TableCell className="font-medium">
                                {linha.script_name ?? '—'}
                                {linha.objective ? (
                                  <p className="mt-1 text-xs text-muted-foreground">{linha.objective}</p>
                                ) : null}
                              </TableCell>
                              <TableCell>{linha.stage ?? '—'}</TableCell>
                              <TableCell>{linha.channel ?? '—'}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatPct(linha.success_rate)}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatNumber(linha.times_used ?? 0)}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {linha.estimated_duration_minutes ? `${formatNumber(linha.estimated_duration_minutes)} min` : '—'}
                              </TableCell>
                              <TableCell>{linha.performance_status ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}