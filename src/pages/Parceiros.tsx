import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, BadgeCheck, ChevronLeft, ChevronRight, RefreshCw, Search, Truck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PARCEIROS_PAGE_SIZE,
  PARCEIRO_CONFIG,
  nomeDoParceiro,
  totalDoParceiro,
  useParceiroFilaHomologacao,
  useParceiroRanking,
  useParceiroResumo,
  type TipoParceiro,
} from '@/hooks/useParceiros';

const SEARCH_DEBOUNCE_MS = 400;

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

const formatPct = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') return '—';
  const numero = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numero) ? `${numero.toFixed(1)}%` : '—';
};

const formatScore = (value: number | null | undefined) =>
  typeof value === 'number' ? value.toFixed(1) : '—';

function QualidadeBarra({ label, pct, total, comCampo }: { label: string; pct: string | number | null; total: number; comCampo: number | null }) {
  const numero = pct === null || pct === undefined ? 0 : Number(pct);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {formatNumber(comCampo ?? 0)}
          <span className="ml-1 text-xs text-muted-foreground">de {formatNumber(total)}</span>
        </span>
      </div>
      <Progress value={Number.isFinite(numero) ? numero : 0} className="h-2" />
    </div>
  );
}

export default function Parceiros() {
  const [tipo, setTipo] = useState<TipoParceiro>('fornecedor');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [somenteHomologados, setSomenteHomologados] = useState(false);
  const [page, setPage] = useState(0);

  const config = PARCEIRO_CONFIG[tipo];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
    setSearchInput('');
    setSearch('');
  }, [tipo]);

  const resumo = useParceiroResumo(tipo);
  const ranking = useParceiroRanking(tipo, { page, search, somenteHomologados });
  const fila = useParceiroFilaHomologacao(tipo);

  const dashboard = resumo.data?.dashboard ?? null;
  const qualidade = resumo.data?.qualidade ?? null;
  const estados = resumo.data?.estados ?? [];
  const total = totalDoParceiro(tipo, dashboard);
  const homologados = dashboard?.total_homologados ?? 0;
  const semAvaliacao = dashboard?.qtd_sem_avaliacao ?? 0;

  const pctHomologados = useMemo(() => {
    if (!total) return 0;
    return Math.round((homologados / total) * 100);
  }, [total, homologados]);

  const kpis = [
    { titulo: config.nome, valor: formatNumber(total), icone: Truck, detalhe: `${estados.length} estados com cadastro` },
    { titulo: 'Homologados', valor: formatNumber(homologados), icone: BadgeCheck, detalhe: `${pctHomologados}% da base` },
    { titulo: 'Sem avaliação', valor: formatNumber(semAvaliacao), icone: AlertTriangle, detalhe: `${formatNumber(dashboard?.total_avaliacoes_realizadas ?? 0)} avaliações registradas` },
    { titulo: 'Cadastro completo', valor: formatPct(qualidade?.pct_cadastro_completo), icone: BadgeCheck, detalhe: `${formatNumber(qualidade?.cadastro_completo ?? 0)} com CNPJ, telefone, e-mail e endereço` },
  ];

  const rows = ranking.data?.rows ?? [];
  const totalRows = ranking.data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalRows / PARCEIROS_PAGE_SIZE));
  const filaRows = fila.data ?? [];
  const atualizando = resumo.isFetching || ranking.isFetching || fila.isFetching;

  const recarregar = () => {
    void resumo.refetch();
    void ranking.refetch();
    void fila.refetch();
  };

  const erro = resumo.error ?? ranking.error ?? fila.error;

  return (
    <AppLayout>
      <Helmet>
        <title>Fornecedores e Transportadoras | SINGU</title>
        <meta
          name="description"
          content="Base de fornecedores e transportadoras: homologação, ranking por score, qualidade do cadastro e distribuição por estado."
        />
      </Helmet>

      <div className="container mx-auto max-w-7xl space-y-6 py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fornecedores e Transportadoras</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quem abastece e quem entrega: homologação, score, qualidade do cadastro e a fila de pendências para agir.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={recarregar} disabled={atualizando}>
            <RefreshCw className={atualizando ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            {atualizando ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>

        <Tabs value={tipo} onValueChange={(valor) => setTipo(valor as TipoParceiro)}>
          <TabsList>
            <TabsTrigger value="fornecedor">Fornecedores</TabsTrigger>
            <TabsTrigger value="transportadora">Transportadoras</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.titulo}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
                <kpi.icone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {resumo.isLoading ? <Skeleton className="h-7 w-20" /> : kpi.valor}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.detalhe}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {erro ? (
          <Card className="border-destructive/40">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Não foi possível carregar {config.nome.toLowerCase()}</p>
                <p className="mt-1 text-sm text-muted-foreground">{erro instanceof Error ? erro.message : 'Erro desconhecido'}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={recarregar}>Tentar novamente</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qualidade do cadastro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resumo.isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, indice) => <Skeleton key={indice} className="h-8 w-full" />)}
                </div>
              ) : (
                <>
                  <QualidadeBarra label="CNPJ" pct={qualidade?.pct_cnpj ?? null} total={total} comCampo={qualidade?.com_cnpj ?? null} />
                  <QualidadeBarra label="Telefone" pct={qualidade?.pct_telefone ?? null} total={total} comCampo={qualidade?.com_telefone ?? null} />
                  <QualidadeBarra label="E-mail" pct={qualidade?.pct_email ?? null} total={total} comCampo={qualidade?.com_email ?? null} />
                  <QualidadeBarra label="Endereço" pct={qualidade?.pct_endereco ?? null} total={total} comCampo={qualidade?.com_endereco ?? null} />
                  <QualidadeBarra label="Cadastro completo" pct={qualidade?.pct_cadastro_completo ?? null} total={total} comCampo={qualidade?.cadastro_completo ?? null} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por estado</CardTitle>
            </CardHeader>
            <CardContent>
              {resumo.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, indice) => <Skeleton key={indice} className="h-8 w-full" />)}
                </div>
              ) : estados.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Nenhum estado com cadastro.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Homologados</TableHead>
                      <TableHead className="text-right">Sem avaliação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estados.slice(0, 10).map((linha, indice) => (
                      <TableRow key={`${linha.estado ?? 'sem-estado'}-${indice}`}>
                        <TableCell className="font-medium">{linha.estado ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.total ?? 0)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.homologados ?? 0)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(Math.max((linha.total ?? 0) - (linha.com_avaliacao ?? 0), 0))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-base">
                Ranking de {config.nome.toLowerCase()} ({formatNumber(totalRows)})
              </CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(evento) => setSearchInput(evento.target.value)}
                    placeholder={`Buscar ${config.singular}…`}
                    className="w-full pl-8 sm:w-64"
                  />
                </div>
                <Select
                  value={somenteHomologados ? 'homologados' : 'todos'}
                  onValueChange={(valor) => {
                    setSomenteHomologados(valor === 'homologados');
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="homologados">Só homologados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ranking.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
              </div>
            ) : rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum {config.singular} encontrado para este filtro.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">#</TableHead>
                      <TableHead>{config.singular === 'fornecedor' ? 'Fornecedor' : 'Transportadora'}</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead>Classificação</TableHead>
                      <TableHead className="text-right">Avaliações</TableHead>
                      <TableHead className="text-right">Homologado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((linha, indice) => (
                      <TableRow key={`${String(linha.company_id ?? indice)}`}>
                        <TableCell className="tabular-nums text-muted-foreground">{linha.ranking ?? indice + 1}</TableCell>
                        <TableCell className="font-medium">{nomeDoParceiro(tipo, linha)}</TableCell>
                        <TableCell className="font-mono text-xs">{linha.cnpj ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatScore(linha.score_geral)}</TableCell>
                        <TableCell>
                          {linha.classificacao ? <Badge variant="secondary">{linha.classificacao}</Badge> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.total_avaliacoes ?? 0)}</TableCell>
                        <TableCell className="text-right">
                          {linha.homologado ? (
                            <Badge>Homologado</Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500/60 text-amber-600 dark:text-amber-400">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Página {Math.min(page + 1, totalPaginas)} de {totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((atual) => Math.max(atual - 1, 0))}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPaginas}
                  onClick={() => setPage((atual) => atual + 1)}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fila de homologação ({formatNumber(filaRows.length)})</CardTitle>
          </CardHeader>
          <CardContent>
            {fila.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
              </div>
            ) : filaRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nada pendente na fila de homologação.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{config.singular === 'fornecedor' ? 'Fornecedor' : 'Transportadora'}</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Último status</TableHead>
                      <TableHead>O que falta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filaRows.map((linha, indice) => (
                      <TableRow key={`fila-${indice}`}>
                        <TableCell className="font-medium">
                          {nomeDoParceiro(tipo, linha)}
                          {linha.cnpj ? <span className="ml-2 font-mono text-xs text-muted-foreground">{linha.cnpj}</span> : null}
                        </TableCell>
                        <TableCell>
                          {[linha.cidade, linha.estado].filter(Boolean).join(' / ') || '—'}
                        </TableCell>
                        <TableCell>{linha.ultimo_status ?? 'Sem homologação'}</TableCell>
                        <TableCell className="text-muted-foreground">{linha.acao_necessaria ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}