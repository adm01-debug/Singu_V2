import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowDown, ArrowUp, Building2, Layers, Network, RefreshCw, Search, ShoppingCart, UserCheck, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TAMANHO_PAGINA_CLIENTES,
  useClientesKpis,
  useClientesLista,
  useCooperativas,
  useHierarquiaEmpresas,
  useHistoricoEmpresas,
  type ClienteRow,
  type CooperativaRow,
  type HierarquiaRow,
  type HistoricoEmpresaRow,
} from '@/hooks/useClientes';

const formatNumber = (valor: number | null | undefined) => (valor ?? 0).toLocaleString('pt-BR');

const formatMoeda = (valor: string | number | null | undefined) => {
  const numero = typeof valor === 'number' ? valor : Number(valor ?? 0);
  if (!Number.isFinite(numero)) return '—';
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

const formatData = (valor: string | null | undefined) => {
  if (!valor) return '—';
  const [ano, mes, dia] = valor.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : '—';
};

const varianteStatus = (valor: string | null | undefined): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const texto = (valor ?? '').toUpperCase();
  if (texto === 'ATIVO') return 'default';
  if (texto === 'PROSPECT_ATIVADO') return 'default';
  if (texto === 'PROSPECT') return 'secondary';
  if (texto === 'INATIVO') return 'outline';
  return 'outline';
};

const rotuloStatus = (valor: string | null | undefined) => {
  const texto = (valor ?? '').toUpperCase();
  if (texto === 'CLIENTE_ATIVO' || texto === 'ATIVO') return 'ATIVO';
  if (texto === 'PROSPECT_ATIVADO') return 'ATIVADO S/ COMPRA';
  if (texto === 'PROSPECT') return 'PROSPECT';
  if (texto === 'INATIVO') return 'INATIVO';
  return valor ?? '—';
};

function Vazio({ texto }: { texto: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{texto}</p>;
}

function Carregando({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: linhas }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
    </div>
  );
}

function Paginacao({ pagina, total, mudarPagina }: { pagina: number; total: number; mudarPagina: (valor: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA_CLIENTES));
  const inicio = total === 0 ? 0 : pagina * TAMANHO_PAGINA_CLIENTES + 1;
  const fim = Math.min((pagina + 1) * TAMANHO_PAGINA_CLIENTES, total);
  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <p className="text-xs text-muted-foreground">{inicio}–{fim} de {formatNumber(total)}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={pagina === 0} onClick={() => mudarPagina(pagina - 1)}>Anterior</Button>
        <span className="text-xs text-muted-foreground">Página {pagina + 1} de {paginas}</span>
        <Button variant="outline" size="sm" disabled={pagina + 1 >= paginas} onClick={() => mudarPagina(pagina + 1)}>Próxima</Button>
      </div>
    </div>
  );
}

function useBuscaAtrasada(valor: string, atraso = 400) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(timer);
  }, [valor, atraso]);
  return atrasado;
}

export default function Clientes() {
  const [aba, setAba] = useState('clientes');
  const [busca, setBusca] = useState('');
  const buscaAtrasada = useBuscaAtrasada(busca);
  const [status, setStatus] = useState('todos');
  const [pagina, setPagina] = useState(0);
  const [ordemClientes, setOrdemClientes] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({ coluna: 'dias_sem_compra', direcao: 'desc' });
  const [paginaHierarquia, setPaginaHierarquia] = useState(0);
  const [paginaCooperativas, setPaginaCooperativas] = useState(0);
  const [paginaHistorico, setPaginaHistorico] = useState(0);
  const [apenasCompradores, setApenasCompradores] = useState(false);

  useEffect(() => { setPagina(0); }, [buscaAtrasada, status]);
  useEffect(() => { setPaginaHierarquia(0); setPaginaCooperativas(0); }, [buscaAtrasada]);
  useEffect(() => { setPaginaHistorico(0); }, [buscaAtrasada, apenasCompradores]);

  const kpis = useClientesKpis();
  const clientes = useClientesLista({
    pagina,
    termo: buscaAtrasada,
    status: status === 'todos' ? '' : status,
    ordenacao: ordemClientes.coluna,
    direcao: ordemClientes.direcao,
  });
  const hierarquia = useHierarquiaEmpresas(paginaHierarquia, buscaAtrasada);
  const cooperativas = useCooperativas(paginaCooperativas, buscaAtrasada);
  const historico = useHistoricoEmpresas(paginaHistorico, buscaAtrasada, apenasCompradores);

  const recarregar = () => {
    kpis.refetch();
    clientes.refetch();
    hierarquia.refetch();
    cooperativas.refetch();
    historico.refetch();
  };

  const ordenarPor = (coluna: string) => {
    setOrdemClientes(atual => ({
      coluna,
      direcao: atual.coluna === coluna && atual.direcao === 'desc' ? 'asc' : 'desc',
    }));
  };

  const cabecalhoOrdenavel = (coluna: string, rotulo: string) => {
    const ativo = ordemClientes.coluna === coluna;
    const Icone = ordemClientes.direcao === 'asc' ? ArrowUp : ArrowDown;
    return (
      <TableHead>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-left font-medium hover:text-foreground"
          onClick={() => ordenarPor(coluna)}
        >
          {rotulo}
          {ativo && <Icone className="h-3 w-3" />}
        </button>
      </TableHead>
    );
  };

  const dadosKpis = kpis.data;
  const cartoes = useMemo(() => [
    { titulo: 'Empresas na base', valor: formatNumber(dadosKpis?.total), icone: Building2 },
    { titulo: 'Clientes ativos', valor: formatNumber(dadosKpis?.ativos), icone: UserCheck },
    { titulo: 'Ativados sem compra', valor: formatNumber(dadosKpis?.ativadosSemCompra), icone: Layers },
    { titulo: 'Já compraram', valor: formatNumber(dadosKpis?.compradores), icone: ShoppingCart },
    { titulo: 'Prospects', valor: formatNumber(dadosKpis?.prospects), icone: Users },
  ], [dadosKpis]);

  return (
    <AppLayout>
      <Helmet>
        <title>Clientes 360 | SINGU</title>
        <meta name="description" content="Carteira de clientes, hierarquia de empresas e cooperativas, histórico de compras e ativação." />
      </Helmet>

      <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes 360</h1>
            <p className="text-sm text-muted-foreground">Carteira, hierarquia de grupos econômicos, cooperativas e histórico de compras.</p>
          </div>
          <Button variant="outline" size="sm" onClick={recarregar} disabled={clientes.isFetching}>
            <RefreshCw className={clientes.isFetching ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            Atualizar
          </Button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cartoes.map(({ titulo, valor, icone: Icone }) => (
            <Card key={titulo}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
                <Icone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{kpis.isLoading ? '—' : valor}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={evento => setBusca(evento.target.value)}
              placeholder="Buscar por empresa, CNPJ, cidade ou grupo econômico"
              className="pl-8"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ATIVO">Ativos</SelectItem>
              <SelectItem value="PROSPECT">Prospects</SelectItem>
              <SelectItem value="INATIVO">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={aba} onValueChange={setAba}>
          <TabsList>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="hierarquia">Hierarquia</TabsTrigger>
            <TabsTrigger value="cooperativas">Cooperativas</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="clientes">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Carteira de clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {clientes.isLoading ? <Carregando /> : clientes.error ? (
                  <Vazio texto="Não foi possível carregar a carteira de clientes." />
                ) : (clientes.data?.linhas.length ?? 0) === 0 ? (
                  <Vazio texto="Nenhum cliente encontrado para o filtro atual." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {cabecalhoOrdenavel('empresa', 'Empresa')}
                            <TableHead>Status</TableHead>
                            <TableHead>Vendedor</TableHead>
                            {cabecalhoOrdenavel('data_ultima_compra', 'Última compra')}
                            {cabecalhoOrdenavel('total_pedidos', 'Pedidos')}
                            {cabecalhoOrdenavel('valor_total_compras', 'Valor')}
                            {cabecalhoOrdenavel('dias_sem_compra', 'Dias sem compra')}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(clientes.data?.linhas ?? []).map((linha: ClienteRow, indice) => (
                            <TableRow key={linha.customer_id ?? `${linha.empresa}-${indice}`}>
                              <TableCell>
                                <p className="font-medium text-foreground">{linha.empresa ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[linha.cnpj, linha.cidade, linha.estado].filter(Boolean).join(' · ') || '—'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant={varianteStatus(linha.status_cliente)}>{rotuloStatus(linha.status_cliente)}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                <p>{linha.vendedor_nome ?? '—'}</p>
                                {linha.ativado_por && <p className="text-xs text-muted-foreground">Ativado por {linha.ativado_por}</p>}
                              </TableCell>
                              <TableCell className="text-sm">{formatData(linha.data_ultima_compra)}</TableCell>
                              <TableCell className="text-sm">{formatNumber(linha.total_pedidos)}</TableCell>
                              <TableCell className="text-sm">{formatMoeda(linha.valor_total_compras)}</TableCell>
                              <TableCell className="text-sm">{linha.dias_sem_compra === null ? '—' : formatNumber(linha.dias_sem_compra)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Paginacao pagina={pagina} total={clientes.data?.total ?? 0} mudarPagina={setPagina} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hierarquia">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Hierarquia de empresas e grupos econômicos</CardTitle>
              </CardHeader>
              <CardContent>
                {hierarquia.isLoading ? <Carregando /> : (hierarquia.data?.linhas.length ?? 0) === 0 ? (
                  <Vazio texto="Nenhuma empresa encontrada." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Grupo econômico</TableHead>
                            <TableHead>Hierarquia</TableHead>
                            <TableHead>Matriz</TableHead>
                            <TableHead>Central / Singular</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(hierarquia.data?.linhas ?? []).map((linha: HierarquiaRow, indice) => (
                            <TableRow key={linha.id ?? `${linha.empresa}-${indice}`}>
                              <TableCell>
                                <p className="font-medium text-foreground">{linha.empresa ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">{linha.cnpj ?? '—'}</p>
                              </TableCell>
                              <TableCell className="text-sm">
                                <p>{linha.grupo_economico ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">{linha.tipo_grupo ?? '—'}</p>
                              </TableCell>
                              <TableCell className="text-sm">{linha.classificacao_hierarquia ?? '—'}</TableCell>
                              <TableCell className="text-sm">
                                {linha.matriz_nome ?? '—'}
                                {linha.is_matriz ? <Badge variant="secondary" className="ml-2">Matriz</Badge> : null}
                              </TableCell>
                              <TableCell className="text-sm">
                                <p>{linha.central_nome ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">{linha.singular_nome ?? '—'}</p>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {[linha.is_customer ? 'Cliente' : null, linha.is_supplier ? 'Fornecedor' : null].filter(Boolean).join(' · ') || '—'}
                              </TableCell>
                              <TableCell className="text-sm">{linha.status ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Paginacao pagina={paginaHierarquia} total={hierarquia.data?.total ?? 0} mudarPagina={setPaginaHierarquia} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cooperativas">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Estrutura de cooperativas</CardTitle>
              </CardHeader>
              <CardContent>
                {cooperativas.isLoading ? <Carregando /> : (cooperativas.data?.linhas.length ?? 0) === 0 ? (
                  <Vazio texto="Nenhuma cooperativa encontrada." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nível</TableHead>
                            <TableHead>Grupo econômico</TableHead>
                            <TableHead>Central</TableHead>
                            <TableHead>Singular</TableHead>
                            <TableHead>PAC</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(cooperativas.data?.linhas ?? []).map((linha: CooperativaRow, indice) => (
                            <TableRow key={`${linha.company_id}-${indice}`}>
                              <TableCell className="text-sm">{linha.nivel ?? '—'}</TableCell>
                              <TableCell className="text-sm">{linha.grupo_economico ?? '—'}</TableCell>
                              <TableCell className="text-sm">{linha.central ?? '—'}</TableCell>
                              <TableCell className="text-sm">{linha.singular ?? '—'}</TableCell>
                              <TableCell className="text-sm">{linha.pac ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Paginacao pagina={paginaCooperativas} total={cooperativas.data?.total ?? 0} mudarPagina={setPaginaCooperativas} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Histórico de compras e ativação</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setApenasCompradores(valor => !valor)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {apenasCompradores ? 'Mostrando compradores' : 'Todos'}
                </Button>
              </CardHeader>
              <CardContent>
                {historico.isLoading ? <Carregando /> : (historico.data?.linhas.length ?? 0) === 0 ? (
                  <Vazio texto="Nenhum registro de histórico encontrado." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Carteira</TableHead>
                            <TableHead>Entrada na carteira</TableHead>
                            <TableHead>1ª compra</TableHead>
                            <TableHead>Última compra</TableHead>
                            <TableHead>Pedidos</TableHead>
                            <TableHead>Valor total</TableHead>
                            <TableHead>Dias sem compra</TableHead>
                            <TableHead>Dias p/ inativar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(historico.data?.linhas ?? []).map((linha: HistoricoEmpresaRow, indice) => (
                            <TableRow key={linha.company_id ?? `${linha.empresa}-${indice}`}>
                              <TableCell>
                                <p className="font-medium text-foreground">{linha.empresa ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">{linha.cnpj ?? '—'}</p>
                              </TableCell>
                              <TableCell className="text-sm">
                                <p>{linha.vendedor_carteira ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">{linha.classificacao ?? '—'}</p>
                              </TableCell>
                              <TableCell className="text-sm">{formatData(linha.data_entrada_carteira)}</TableCell>
                              <TableCell className="text-sm">{formatData(linha.data_primeira_compra)}</TableCell>
                              <TableCell className="text-sm">{formatData(linha.data_ultima_compra)}</TableCell>
                              <TableCell className="text-sm">{formatNumber(linha.total_pedidos)}</TableCell>
                              <TableCell className="text-sm">{formatMoeda(linha.valor_total_compras)}</TableCell>
                              <TableCell className="text-sm">{linha.dias_sem_compra === null ? '—' : formatNumber(linha.dias_sem_compra)}</TableCell>
                              <TableCell className="text-sm">{linha.dias_para_inativar === null ? '—' : formatNumber(linha.dias_para_inativar)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Paginacao pagina={paginaHistorico} total={historico.data?.total ?? 0} mudarPagina={setPaginaHistorico} />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Network className="h-3 w-3" />
          Dados vindos das views do CRM (clientes, hierarquia, cooperativas e histórico) com as permissões do seu usuário.
        </p>
      </div>
    </AppLayout>
  );
}