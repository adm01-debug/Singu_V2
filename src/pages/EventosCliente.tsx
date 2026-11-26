import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, ArrowRightLeft, ChevronLeft, ChevronRight, History, Search, ShoppingCart, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TAMANHO_PAGINA, TIPOS_EVENTO, rotuloTipoEvento, useEventosCliente, useResumoEventos } from '@/hooks/useEventosCliente';

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

const formatData = (valor: string | null | undefined) => {
  if (!valor) return '—';
  const data = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(data.getTime())) return valor;
  return format(data, "dd/MM/yyyy", { locale: ptBR });
};

const TIPO_CLASSE: Record<string, string> = {
  COMPRA: 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400',
  PRIMEIRA_COMPRA: 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400',
  ATIVACAO: 'border-sky-500/60 text-sky-600 dark:text-sky-400',
  REATIVACAO: 'border-sky-500/60 text-sky-600 dark:text-sky-400',
  INATIVACAO: 'border-destructive/60 text-destructive',
  TRANSFERENCIA: 'border-amber-500/60 text-amber-600 dark:text-amber-400',
  ATRIBUIDO_SDR: 'border-violet-500/60 text-violet-600 dark:text-violet-400',
  QUALIFICADO_SDR: 'border-violet-500/60 text-violet-600 dark:text-violet-400',
};

const ROTULO_EXTRA: Record<string, string> = {
  numero_pedido: 'Pedido',
  total_pedidos: 'Pedidos',
  sdr_nome: 'SDR',
  closer_nome: 'Closer',
  vendedor_anterior_nome: 'De',
  vendedor_novo_nome: 'Para',
  motivo: 'Motivo',
};

function formatValor(chave: string, valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (chave === 'valor' || chave === 'valor_total') {
    const numero = Number(valor);
    if (Number.isFinite(numero)) {
      return `${chave === 'valor_total' ? 'Total ' : ''}R$ ${numero.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
  }
  if (typeof valor === 'object') return null;
  return `${ROTULO_EXTRA[chave] ?? chave}: ${String(valor)}`;
}

function DetalhesEvento({ extras }: { extras: Record<string, unknown> | null }) {
  const chips = useMemo(() => {
    if (!extras) return [] as string[];
    return Object.entries(extras)
      .filter(([chave]) => !chave.endsWith('_id'))
      .map(([chave, valor]) => formatValor(chave, valor))
      .filter((texto): texto is string => Boolean(texto));
  }, [extras]);

  if (chips.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((texto) => (
        <Badge key={texto} variant="secondary" className="text-xs font-normal">{texto}</Badge>
      ))}
    </div>
  );
}

export default function EventosCliente() {
  const [buscaInput, setBuscaInput] = useState('');
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setBusca(buscaInput);
      setPagina(0);
    }, 400);
    return () => clearTimeout(temporizador);
  }, [buscaInput]);

  const eventos = useEventosCliente({ pagina, busca, tipo });
  const resumo = useResumoEventos();

  const linhas = eventos.data?.linhas ?? [];
  const total = eventos.data?.total ?? 0;
  const paginas = Math.max(Math.ceil(total / TAMANHO_PAGINA), 1);

  const kpis = [
    { titulo: 'Eventos registrados', valor: resumo.data?.total, icone: History, detalhe: 'histórico completo de clientes' },
    { titulo: 'Compras', valor: resumo.data?.compras, icone: ShoppingCart, detalhe: 'primeira compra incluída' },
    { titulo: 'Transferências de carteira', valor: resumo.data?.transferencias, icone: ArrowRightLeft, detalhe: 'troca de vendedor responsável' },
    { titulo: 'Movimentos de SDR', valor: resumo.data?.sdr, icone: Sparkles, detalhe: 'atribuição e qualificação' },
  ];

  return (
    <AppLayout>
      <Helmet>
        <title>Eventos de cliente | SINGU</title>
        <meta
          name="description"
          content="Histórico de eventos de cliente: compras, transferência de carteira, ativação, inativação e movimentos de SDR."
        />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Eventos de cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Linha do tempo dos eventos de negócio de cada cliente: compras, transferências de carteira, ativação, inativação e SDR.
          </p>
        </div>

        {resumo.error ? (
          <Card className="border-destructive/40">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Não foi possível carregar os totais</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {resumo.error instanceof Error ? resumo.error.message : 'Erro desconhecido'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <Card key={kpi.titulo}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
                  <kpi.icone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {resumo.isLoading ? <Skeleton className="h-7 w-16" /> : formatNumber(kpi.valor ?? 0)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.detalhe}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Linha do tempo ({formatNumber(total)})</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Evento mais recente primeiro; use a busca por empresa ou CNPJ.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={buscaInput}
                    onChange={(evento) => setBuscaInput(evento.target.value)}
                    placeholder="Buscar empresa ou CNPJ…"
                    className="w-full pl-8 sm:w-64"
                  />
                </div>
                <Select
                  value={tipo}
                  onValueChange={(valor) => {
                    setTipo(valor);
                    setPagina(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {TIPOS_EVENTO.map((item) => (
                      <SelectItem key={item.valor} value={item.valor}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventos.error ? (
              <div className="flex items-start gap-3 py-6">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-foreground">Não foi possível carregar a linha do tempo</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {eventos.error instanceof Error ? eventos.error.message : 'Erro desconhecido'}
                  </p>
                </div>
              </div>
            ) : eventos.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
              </div>
            ) : linhas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum evento encontrado com estes filtros.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhas.map((linha, indice) => (
                      <TableRow key={String(linha.id ?? `evento-${indice}`)}>
                        <TableCell className="whitespace-nowrap tabular-nums">{formatData(linha.data_evento)}</TableCell>
                        <TableCell className="font-medium">
                          {linha.empresa_nome ?? '—'}
                          {linha.empresa_cnpj ? (
                            <p className="mt-1 font-mono text-xs text-muted-foreground">{linha.empresa_cnpj}</p>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={TIPO_CLASSE[linha.evento_tipo ?? '']}>
                            {rotuloTipoEvento(linha.evento_tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>{linha.executado_por_nome ?? linha.vendedor_nome ?? '—'}</TableCell>
                        <TableCell><DetalhesEvento extras={linha.dados_extras} /></TableCell>
                        <TableCell className="max-w-xs text-muted-foreground">{linha.observacoes ?? linha.motivo ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                Página {Math.min(pagina + 1, paginas)} de {paginas}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina === 0}
                  onClick={() => setPagina((atual) => Math.max(atual - 1, 0))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina + 1 >= paginas}
                  onClick={() => setPagina((atual) => atual + 1)}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}