import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Factory, Search, Target, TrendingUp, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEmpresasDoRamo, useRankingRamos, type RamoConsolidado } from '@/hooks/useInteligenciaRamos';

const POR_PAGINA = 25;

const formatNumero = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : valor.toLocaleString('pt-BR');

const formatMoeda = (valor: number | null | undefined) => {
  if (valor === null || valor === undefined) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

const formatPct = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

const nomeEmpresa = (empresa: { nome_crm: string | null; nome_fantasia: string | null; razao_social: string | null }) =>
  empresa.nome_crm || empresa.nome_fantasia || empresa.razao_social || 'Sem nome';

type Ordem = 'empresas' | 'conversao' | 'receita';

function EmpresasDoRamo({ ramo, onFechar }: { ramo: string; onFechar: () => void }) {
  const { data, isLoading, error } = useEmpresasDoRamo(ramo);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{ramo}</CardTitle>
            <CardDescription>
              {isLoading ? 'Carregando empresas…' : `${formatNumero(data?.total)} empresa(s) neste ramo — 25 primeiras`}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onFechar} aria-label="Fechar lista de empresas">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
          </div>
        ) : error ? (
          <p className="py-6 text-sm text-destructive">
            Não foi possível carregar as empresas deste ramo: {error instanceof Error ? error.message : 'erro desconhecido'}
          </p>
        ) : (data?.empresas.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma empresa neste ramo.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.empresas ?? []).map((empresa) => (
                <TableRow key={empresa.id}>
                  <TableCell className="font-medium">{nomeEmpresa(empresa)}</TableCell>
                  <TableCell className="font-mono text-xs">{empresa.cnpj || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <Badge variant={empresa.is_customer ? 'secondary' : 'outline'}>
                      {empresa.is_customer ? 'Cliente' : (empresa.status ?? 'Prospect')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/empresas/${empresa.id}`}>
                        Abrir
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function InteligenciaRamos() {
  const { data, isLoading, error, refetch, isFetching } = useRankingRamos();
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('empresas');
  const [pagina, setPagina] = useState(1);
  const [ramoSelecionado, setRamoSelecionado] = useState<string | null>(null);

  const totalEmpresas = useMemo(
    () => (data ?? []).reduce((soma, linha) => soma + linha.empresas, 0),
    [data],
  );
  const ramosComReceita = useMemo(() => (data ?? []).filter((linha) => linha.receita > 0).length, [data]);
  const liderReceita = useMemo<RamoConsolidado | null>(
    () => (data ?? []).reduce<RamoConsolidado | null>(
      (melhor, linha) => (melhor === null || linha.receita > melhor.receita ? linha : melhor),
      null,
    ),
    [data],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = termo === ''
      ? [...(data ?? [])]
      : (data ?? []).filter((linha) => linha.ramo.toLowerCase().includes(termo));
    return base.sort((a, b) => {
      if (ordem === 'receita') return b.receita - a.receita;
      if (ordem === 'conversao') return (b.conversao ?? -1) - (a.conversao ?? -1);
      return b.empresas - a.empresas;
    });
  }, [data, busca, ordem]);

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, paginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const kpis = [
    { titulo: 'Ramos mapeados', valor: formatNumero(data?.length), detalhe: 'classificados em ramo_atividade', icone: Factory },
    { titulo: 'Empresas classificadas', valor: formatNumero(totalEmpresas), detalhe: 'soma de todos os ramos', icone: Building2 },
    { titulo: 'Ramos com receita', valor: formatNumero(ramosComReceita), detalhe: 'ao menos um negócio ganho', icone: TrendingUp },
    {
      titulo: 'Maior receita',
      valor: formatMoeda(liderReceita?.receita ?? null),
      detalhe: liderReceita?.ramo ?? 'sem negócios ganhos',
      icone: Target,
    },
  ];

  return (
    <AppLayout>
      <Helmet>
        <title>Inteligência por ramo · Singu</title>
      </Helmet>
      <div className="space-y-6 p-4 md:p-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Inteligência por ramo</h1>
          <p className="text-sm text-muted-foreground">
            Distribuição da base e receita ganha por ramo de atividade, para priorizar prospecção.
          </p>
        </header>

        {error ? (
          <Card>
            <CardContent className="py-8 text-sm text-destructive">
              Não foi possível carregar o ranking de ramos: {error instanceof Error ? error.message : 'erro desconhecido'}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map(({ titulo, valor, detalhe, icone: Icone }) => (
                <Card key={titulo}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="rounded-md bg-muted p-2 text-muted-foreground">
                      <Icone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
                      {isLoading ? (
                        <Skeleton className="mt-1 h-7 w-24" />
                      ) : (
                        <p className="truncate text-xl font-semibold tabular-nums" title={String(valor)}>{valor}</p>
                      )}
                      <p className="truncate text-xs text-muted-foreground" title={detalhe}>{detalhe}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base">Ranking de ramos</CardTitle>
                    <CardDescription>Conversão = percentual de empresas do ramo que já são clientes.</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={busca}
                        onChange={(evento) => { setBusca(evento.target.value); setPagina(1); }}
                        placeholder="Buscar ramo"
                        className="pl-9 sm:w-64"
                      />
                    </div>
                    <Select value={ordem} onValueChange={(valor) => { setOrdem(valor as Ordem); setPagina(1); }}>
                      <SelectTrigger className="sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="empresas">Mais empresas</SelectItem>
                        <SelectItem value="conversao">Melhor conversão</SelectItem>
                        <SelectItem value="receita">Maior receita</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => { void refetch(); }} disabled={isFetching}>
                      {isFetching ? 'Atualizando…' : 'Atualizar'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
                  </div>
                ) : visiveis.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum ramo encontrado com essa busca.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ramo</TableHead>
                          <TableHead className="text-right">Empresas</TableHead>
                          <TableHead className="text-right">Conversão</TableHead>
                          <TableHead className="text-right">Receita ganha</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visiveis.map((linha) => (
                          <TableRow key={linha.ramo} data-state={ramoSelecionado === linha.ramo ? 'selected' : undefined}>
                            <TableCell className="max-w-[22rem] truncate font-medium" title={linha.ramo}>{linha.ramo}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumero(linha.empresas)}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              <Badge variant={(linha.conversao ?? 0) >= 50 ? 'secondary' : 'outline'}>{formatPct(linha.conversao)}</Badge>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{formatMoeda(linha.receita)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={ramoSelecionado === linha.ramo ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setRamoSelecionado(ramoSelecionado === linha.ramo ? null : linha.ramo)}
                              >
                                {ramoSelecionado === linha.ramo ? 'Ocultar' : 'Ver empresas'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        Página {paginaAtual} de {paginas} · {formatNumero(filtrados.length)} ramo(s)
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={paginaAtual <= 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</Button>
                        <Button variant="outline" size="sm" disabled={paginaAtual >= paginas} onClick={() => setPagina(paginaAtual + 1)}>Próxima</Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {ramoSelecionado && <EmpresasDoRamo ramo={ramoSelecionado} onFechar={() => setRamoSelecionado(null)} />}
          </>
        )}
      </div>
    </AppLayout>
  );
}