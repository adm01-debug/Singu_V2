import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, BadgeCheck, Building2, RefreshCw, Search, TrendingDown, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useCarteiraPainel,
  type CarteiraEventoRow,
  type CarteiraPrioridadeRow,
  type CarteiraRiscoRow,
  type CarteiraVendedorRow,
  type MatrizFiliaisRow,
  type TopClienteRow,
} from '@/hooks/useCarteira';

const formatNumber = (valor: number | null | undefined) => (valor ?? 0).toLocaleString('pt-BR');

const formatMoeda = (valor: string | number | null | undefined) => {
  const numero = typeof valor === 'number' ? valor : Number(valor ?? 0);
  if (!Number.isFinite(numero)) return '—';
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

const formatPct = (valor: string | number | null | undefined) => {
  const numero = typeof valor === 'number' ? valor : Number(valor ?? NaN);
  return Number.isFinite(numero) ? `${numero.toFixed(1)}%` : '—';
};

const formatData = (valor: string | null | undefined) => {
  if (!valor) return '—';
  const [ano, mes, dia] = valor.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—';
};

const variantePrioridade = (valor: string | null | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const texto = (valor ?? '').toLowerCase();
  if (texto.includes('critic') || texto.includes('urgent') || texto.includes('alta')) return 'destructive';
  if (texto.includes('risco') || texto.includes('media') || texto.includes('média')) return 'default';
  if (texto.includes('baixa')) return 'secondary';
  return 'outline';
};

function Vazio({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{texto}</p>;
}

function Carregando({ linhas = 5 }: { linhas?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: linhas }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
    </div>
  );
}

export default function Carteira() {
  const [busca, setBusca] = useState('');
  const painel = useCarteiraPainel();
  const dados = painel.data;

  const vendedores = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const linhas = dados?.vendedores ?? [];
    if (!termo) return linhas;
    return linhas.filter((linha) => (linha.vendedor_nome ?? '').toLowerCase().includes(termo));
  }, [dados?.vendedores, busca]);

  const resumoPorVendedor = useMemo(() => {
    const mapa = new Map<number, string>();
    (dados?.resumoDia ?? []).forEach((linha) => {
      if (linha.vendedor_id !== null && linha.mensagem_dia) mapa.set(linha.vendedor_id, linha.mensagem_dia);
    });
    return mapa;
  }, [dados?.resumoDia]);

  const totalClientes = (dados?.vendedores ?? []).reduce((soma, linha) => soma + (linha.total_clientes ?? 0), 0);
  const totalAtivos = (dados?.vendedores ?? []).reduce((soma, linha) => soma + (linha.ativos ?? 0), 0);
  const totalRisco = (dados?.vendedores ?? []).reduce((soma, linha) => soma + (linha.em_risco ?? 0), 0);
  const totalCriticos = (dados?.vendedores ?? []).reduce((soma, linha) => soma + (linha.criticos ?? 0), 0);
  const valorCarteira = (dados?.vendedores ?? []).reduce((soma, linha) => {
    const valor = typeof linha.valor_total_carteira === 'number' ? linha.valor_total_carteira : Number(linha.valor_total_carteira ?? 0);
    return soma + (Number.isFinite(valor) ? valor : 0);
  }, 0);
  const novos30 = (dados?.vendedores ?? []).reduce((soma, linha) => soma + (linha.novos_30_dias ?? 0), 0);

  const kpis = [
    { titulo: 'Vendedores com carteira', valor: formatNumber(dados?.vendedores.length ?? 0), icone: Users, detalhe: `${formatNumber(novos30)} clientes novos em 30 dias` },
    { titulo: 'Clientes na carteira', valor: formatNumber(totalClientes), icone: Building2, detalhe: `${formatMoeda(valorCarteira)} em compras acumuladas` },
    { titulo: 'Clientes ativos', valor: formatNumber(totalAtivos), icone: BadgeCheck, detalhe: `${formatPct(totalClientes ? (totalAtivos / totalClientes) * 100 : 0)} da carteira` },
    { titulo: 'Em risco de inativação', valor: formatNumber(totalRisco), icone: TrendingDown, detalhe: `${formatNumber(totalCriticos)} em estado crítico` },
  ];

  const recarregar = () => { void painel.refetch(); };
  const erro = painel.error;

  return (
    <AppLayout>
      <Helmet>
        <title>Carteira e ativação | SINGU</title>
        <meta
          name="description"
          content="Carteira por vendedor: ativos, ex-clientes, prospects, risco de inativação, quem ativou e quem inativou cada cliente."
        />
      </Helmet>

      <div className="container mx-auto max-w-7xl space-y-6 py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Carteira e ativação</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quem cuida de cada cliente, quem está ativo, quem parou de comprar e quem ativou ou inativou cada conta.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={recarregar} disabled={painel.isFetching}>
            <RefreshCw className={painel.isFetching ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            {painel.isFetching ? 'Atualizando…' : 'Atualizar'}
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
                <div className="text-2xl font-bold">{painel.isLoading ? <Skeleton className="h-7 w-20" /> : kpi.valor}</div>
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
                <p className="font-medium text-foreground">Não foi possível carregar a carteira</p>
                <p className="mt-1 text-sm text-muted-foreground">{erro instanceof Error ? erro.message : 'Erro desconhecido'}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={recarregar}>Tentar novamente</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Carteira por vendedor</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Buscar vendedor…"
                  className="w-full pl-8 sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {painel.isLoading ? (
              <Carregando linhas={6} />
            ) : vendedores.length === 0 ? (
              <Vazio texto="Nenhum vendedor com carteira." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Carteira</TableHead>
                      <TableHead className="text-right">Ativos</TableHead>
                      <TableHead className="text-right">Ex-clientes</TableHead>
                      <TableHead className="text-right">Prospects</TableHead>
                      <TableHead className="text-right">% ativos</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ticket médio</TableHead>
                      <TableHead className="text-right">Em risco</TableHead>
                      <TableHead className="text-right">Críticos</TableHead>
                      <TableHead className="text-right">Novos 30d</TableHead>
                      <TableHead className="text-right">Compraram 30d</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendedores.map((linha: CarteiraVendedorRow) => (
                      <TableRow key={`vendedor-${linha.vendedor_id ?? linha.vendedor_nome}`}>
                        <TableCell className="font-medium">
                          {linha.vendedor_nome ?? '—'}
                          {linha.vendedor_id !== null && resumoPorVendedor.get(linha.vendedor_id) ? (
                            <div className="text-xs font-normal text-muted-foreground">{resumoPorVendedor.get(linha.vendedor_id)}</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.total_clientes)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.ativos)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.ex_clientes)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.prospects)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatPct(linha.pct_ativos)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoeda(linha.valor_total_carteira)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoeda(linha.ticket_medio_cliente)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.em_risco)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.criticos)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.novos_30_dias)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.compraram_30_dias)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quem ativou (últimas {formatNumber(dados?.ativacoes.length ?? 0)})</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.ativacoes.length ?? 0) === 0 ? (
                <Vazio texto="Nenhuma ativação registrada." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Ativado por</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.ativacoes ?? []).map((linha: CarteiraEventoRow, indice) => (
                      <TableRow key={`ativacao-${indice}`}>
                        <TableCell className="font-medium">{linha.empresa ?? '—'}</TableCell>
                        <TableCell>{linha.ativador_nome ?? '—'}</TableCell>
                        <TableCell>{linha.evento_tipo ?? '—'}</TableCell>
                        <TableCell className="tabular-nums">{formatData(linha.data_ativacao)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quem inativou (últimas {formatNumber(dados?.inativacoes.length ?? 0)})</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.inativacoes.length ?? 0) === 0 ? (
                <Vazio texto="Nenhuma inativação registrada." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Inativado por</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.inativacoes ?? []).map((linha: CarteiraEventoRow, indice) => (
                      <TableRow key={`inativacao-${indice}`}>
                        <TableCell className="font-medium">{linha.empresa ?? '—'}</TableCell>
                        <TableCell>{linha.inativador_nome ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{linha.motivo_inativacao ?? '—'}</TableCell>
                        <TableCell className="tabular-nums">{formatData(linha.data_inativacao)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risco de inativação</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.risco.length ?? 0) === 0 ? (
                <Vazio texto="Nenhum cliente em risco." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Dias sem compra</TableHead>
                      <TableHead className="text-right">Dias p/ inativar</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.risco ?? []).map((linha: CarteiraRiscoRow, indice) => (
                      <TableRow key={`risco-${linha.company_id ?? indice}`}>
                        <TableCell className="font-medium">{linha.empresa ?? '—'}</TableCell>
                        <TableCell>{linha.vendedor_nome ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.dias_sem_compra)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.dias_para_inativar)}</TableCell>
                        <TableCell>
                          {linha.status_risco ? (
                            <Badge variant={variantePrioridade(linha.status_risco)}>{linha.status_risco}</Badge>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prioridades do dia</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.prioridade.length ?? 0) === 0 ? (
                <Vazio texto="Nenhuma prioridade definida." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Dias sem compra</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Ação sugerida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.prioridade ?? []).map((linha: CarteiraPrioridadeRow, indice) => (
                      <TableRow key={`prioridade-${linha.company_id ?? indice}`}>
                        <TableCell className="font-medium">{linha.empresa ?? '—'}</TableCell>
                        <TableCell>{linha.vendedor_nome ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.dias_sem_compra)}</TableCell>
                        <TableCell>
                          {linha.status_prioridade ? (
                            <Badge variant={variantePrioridade(linha.status_prioridade)}>{linha.status_prioridade}</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{linha.acao_sugerida ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top clientes por vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.topClientes.length ?? 0) === 0 ? (
                <Vazio texto="Nenhum cliente com compra registrada." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Compras</TableHead>
                      <TableHead className="text-right">Pedidos</TableHead>
                      <TableHead className="text-right">Última compra</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.topClientes ?? []).map((linha: TopClienteRow, indice) => (
                      <TableRow key={`top-${indice}`}>
                        <TableCell>{linha.vendedor_nome ?? '—'}</TableCell>
                        <TableCell className="font-medium">{linha.empresa ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoeda(linha.valor_total_compras)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.total_pedidos)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatData(linha.data_ultima_compra)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matrizes e filiais</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.matrizes.length ?? 0) === 0 ? (
                <Vazio texto="Nenhuma matriz com filiais." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matriz</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-right">Filiais</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.matrizes ?? []).map((linha: MatrizFiliaisRow, indice) => (
                      <TableRow key={`matriz-${linha.matriz_id ?? indice}`}>
                        <TableCell className="font-medium">{linha.matriz_nome ?? '—'}</TableCell>
                        <TableCell>{linha.grupo_economico ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.total_filiais)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de carteira (entradas e saídas)</CardTitle>
          </CardHeader>
          <CardContent>
            {painel.isLoading ? (
              <Carregando />
            ) : (dados?.historico.length ?? 0) === 0 ? (
              <Vazio texto="Nenhuma movimentação de carteira registrada." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Registrado por</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Fim</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.historico ?? []).map((linha, indice) => (
                      <TableRow key={`historico-${indice}`}>
                        <TableCell className="font-medium">{linha.empresa_nome ?? '—'}</TableCell>
                        <TableCell>{linha.registrado_por_nome ?? '—'}</TableCell>
                        <TableCell className="tabular-nums">{formatData(linha.data_inicio)}</TableCell>
                        <TableCell className="tabular-nums">{formatData(linha.data_fim)}</TableCell>
                        <TableCell className="text-muted-foreground">{linha.motivo_entrada ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{linha.motivo_saida ?? '—'}</TableCell>
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