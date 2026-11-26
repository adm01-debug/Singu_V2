import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Building2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Network, Search, TrendingUp, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGruposEconomicosPagina, useGruposEconomicosTotais, type GrupoSortKey } from '@/hooks/useGruposEconomicos';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 400;

interface GrupoLinha {
  chave: string;
  nome: string;
  tipo: string | null;
  empresas: number;
  clientes: number;
  prospects: number;
  penetracao: number;
  singulares: number;
  pacs: number;
  filiais: number;
}

function SortableHead({
  label,
  column,
  sortKey,
  sortAsc,
  onSort,
  className,
}: {
  label: string;
  column: GrupoSortKey;
  sortKey: GrupoSortKey;
  sortAsc: boolean;
  onSort: (column: GrupoSortKey) => void;
  className?: string;
}) {
  const ativo = sortKey === column;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {label}
        {ativo ? sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" /> : null}
      </button>
    </TableHead>
  );
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export default function GruposEconomicos() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState<string | null>(null);
  const [incluirSemEmpresas, setIncluirSemEmpresas] = useState(false);
  const [sortKey, setSortKey] = useState<GrupoSortKey>('empresas');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search, tipo, incluirSemEmpresas, sortKey, sortAsc }),
    [page, search, tipo, incluirSemEmpresas, sortKey, sortAsc],
  );

  const { data: pagina, isLoading, isError, error, refetch, isFetching } = useGruposEconomicosPagina(params);
  const { data: totais } = useGruposEconomicosTotais(incluirSemEmpresas);

  const linhas = useMemo<GrupoLinha[]>(
    () =>
      (pagina?.rows ?? []).map((grupo, indice) => {
        const empresas = grupo.total_empresas ?? 0;
        const clientes = grupo.clientes ?? 0;
        return {
          chave: grupo.grupo_id ?? `${grupo.grupo_economico ?? 'sem-nome'}-${indice}`,
          nome: grupo.grupo_economico ?? 'Sem nome',
          tipo: grupo.tipo_grupo,
          empresas,
          clientes,
          prospects: Math.max(empresas - clientes, 0),
          penetracao: empresas > 0 ? Math.round((clientes / empresas) * 100) : 0,
          singulares: grupo.singulares ?? 0,
          pacs: grupo.pacs ?? 0,
          filiais: grupo.filiais ?? 0,
        };
      }),
    [pagina],
  );

  const totalPaginas = Math.max(1, Math.ceil((pagina?.total ?? 0) / PAGE_SIZE));
  const paginaAtual = Math.min(page, totalPaginas - 1);

  const handleSort = (coluna: GrupoSortKey) => {
    setPage(0);
    if (coluna === sortKey) {
      setSortAsc((atual) => !atual);
      return;
    }
    setSortKey(coluna);
    setSortAsc(coluna === 'grupo_economico');
  };

  const abrirEmpresasDoGrupo = (nome: string) => {
    const filtros = encodeURIComponent(JSON.stringify({ grupo_economico: [nome] }));
    navigate(`/empresas?filters=${filtros}`);
  };

  const kpis = [
    { titulo: 'Grupos econômicos', valor: formatNumber(totais?.grupos ?? 0), icone: Network, detalhe: 'com empresas na sua carteira' },
    { titulo: 'Empresas', valor: formatNumber(totais?.empresas ?? 0), icone: Building2, detalhe: 'somadas em todos os grupos' },
    { titulo: 'Clientes', valor: formatNumber(totais?.clientes ?? 0), icone: Users, detalhe: `${totais?.penetracao ?? 0}% de penetração` },
    { titulo: 'Prospects', valor: formatNumber(totais?.prospects ?? 0), icone: TrendingUp, detalhe: 'empresas do grupo ainda sem compra' },
  ];

  return (
    <AppLayout>
      <Helmet>
        <title>Grupos Econômicos | SINGU</title>
        <meta name="description" content="Panorama dos grupos econômicos, penetração de clientes e oportunidades de expansão no SINGU." />
      </Helmet>

      <div className="container mx-auto max-w-7xl space-y-6 py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Grupos Econômicos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Panorama consolidado por grupo: quantas empresas existem, quantas já compram e onde está a oportunidade.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.titulo}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
                <kpi.icone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totais ? kpi.valor : <Skeleton className="h-7 w-20" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.detalhe}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-base">Grupos ({formatNumber(pagina?.total ?? 0)})</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(evento) => setSearchInput(evento.target.value)}
                    placeholder="Buscar grupo…"
                    className="w-full pl-8 sm:w-64"
                  />
                </div>
                <Select
                  value={tipo ?? 'todos'}
                  onValueChange={(valor) => {
                    setTipo(valor === 'todos' ? null : valor);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Tipo de grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {(totais?.tipos ?? []).map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.replace(/_/g, ' ').toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={incluirSemEmpresas ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setIncluirSemEmpresas((atual) => !atual);
                    setPage(0);
                  }}
                >
                  {incluirSemEmpresas ? 'Ocultar sem empresas' : 'Incluir sem empresas'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar os grupos econômicos: {(error as Error)?.message ?? 'erro desconhecido'}
                </p>
                <Button size="sm" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, indice) => (
                  <Skeleton key={indice} className="h-10 w-full" />
                ))}
              </div>
            ) : linhas.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Nenhum grupo encontrado com os filtros atuais.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Grupo" column="grupo_economico" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
                    <TableHead>Tipo</TableHead>
                    <SortableHead label="Empresas" column="empresas" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} className="text-right" />
                    <SortableHead label="Clientes" column="clientes" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} className="text-right" />
                    <TableHead className="text-right">Prospects</TableHead>
                    <TableHead className="w-40">Penetração</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((linha) => (
                    <TableRow key={linha.chave}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{linha.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(linha.filiais)} filiais · {formatNumber(linha.singulares)} singulares · {formatNumber(linha.pacs)} PACs
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {linha.tipo ? (
                          <Badge variant="outline">{linha.tipo.replace(/_/g, ' ').toLowerCase()}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(linha.empresas)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(linha.clientes)}</TableCell>
                      <TableCell className={cn('text-right tabular-nums', linha.prospects > 0 && 'font-semibold text-foreground')}>
                        {formatNumber(linha.prospects)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={linha.penetracao} className="h-2 w-20" />
                          <span className="text-xs tabular-nums text-muted-foreground">{linha.penetracao}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => abrirEmpresasDoGrupo(linha.nome)}>
                          Ver empresas
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && !isError && (pagina?.total ?? 0) > PAGE_SIZE ? (
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-muted-foreground">
                  Página {paginaAtual + 1} de {totalPaginas} · {formatNumber(pagina?.total ?? 0)} grupos
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={paginaAtual === 0} onClick={() => setPage(paginaAtual - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual >= totalPaginas - 1}
                    onClick={() => setPage(paginaAtual + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}