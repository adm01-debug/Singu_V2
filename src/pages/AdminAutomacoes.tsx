import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, BellRing, Bot, CheckCircle2, MessageSquare, RefreshCw, Search, UserRound } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useAutomacoesPainel,
  type ApelidoProgressoRow,
  type CanalStatsRow,
  type NotificacaoUsuarioRow,
  type RegraAutomacaoRow,
} from '@/hooks/useAutomacoes';

const formatNumber = (valor: number | null | undefined) => (valor ?? 0).toLocaleString('pt-BR');

const formatPercentual = (valor: string | number | null | undefined) => {
  const numero = typeof valor === 'number' ? valor : Number(valor ?? NaN);
  return Number.isFinite(numero) ? Math.max(0, Math.min(100, numero)) : 0;
};

const formatDataHora = (valor: string | null | undefined) => {
  if (!valor) return '—';
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
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

export default function AdminAutomacoes() {
  const [busca, setBusca] = useState('');
  const painel = useAutomacoesPainel();
  const dados = painel.data;

  const emailPorUsuario = useMemo(() => {
    const mapa = new Map<string, string>();
    (dados?.notificacoes ?? []).forEach((linha) => {
      if (linha.user_id && linha.email) mapa.set(linha.user_id, linha.email);
    });
    return mapa;
  }, [dados?.notificacoes]);

  const regras = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const linhas = dados?.regras ?? [];
    if (!termo) return linhas;
    return linhas.filter((linha) => {
      const alvo = `${linha.rule_name ?? ''} ${linha.trigger_type ?? ''} ${emailPorUsuario.get(linha.user_id ?? '') ?? ''}`.toLowerCase();
      return alvo.includes(termo);
    });
  }, [dados?.regras, emailPorUsuario, busca]);

  const regrasAtivas = (dados?.regras ?? []).filter((linha) => linha.is_active).length;
  const regrasComFalha = (dados?.regras ?? []).filter((linha) => (linha.failed_runs ?? 0) > 0 || Boolean(linha.last_error)).length;
  const execucoes = (dados?.regras ?? []).reduce((soma, linha) => soma + (linha.execution_count ?? 0), 0);
  const naoLidas = (dados?.notificacoes ?? []).reduce((soma, linha) => soma + (linha.unread_notifications ?? 0), 0);
  const atrasados = (dados?.notificacoes ?? []).reduce((soma, linha) => soma + (linha.overdue_reminders ?? 0), 0);

  const kpis = [
    { titulo: 'Regras de automação', valor: formatNumber(dados?.regras.length ?? 0), detalhe: `${formatNumber(regrasAtivas)} ativas`, icone: Bot },
    { titulo: 'Regras com falha', valor: formatNumber(regrasComFalha), detalhe: 'execuções que retornaram erro', icone: AlertTriangle },
    { titulo: 'Execuções acumuladas', valor: formatNumber(execucoes), detalhe: 'desde a criação das regras', icone: CheckCircle2 },
    { titulo: 'Notificações não lidas', valor: formatNumber(naoLidas), detalhe: `${formatNumber(atrasados)} lembretes atrasados`, icone: BellRing },
  ];

  const recarregar = () => { void painel.refetch(); };
  const erro = painel.error;

  return (
    <AppLayout>
      <Helmet>
        <title>Saúde das automações | SINGU</title>
        <meta
          name="description"
          content="Regras de automação por usuário, falhas de execução, notificações pendentes, progresso de apelidos e canais de comunicação."
        />
      </Helmet>

      <div className="container mx-auto max-w-7xl space-y-6 py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saúde das automações</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              O que está rodando sozinho, o que falhou e o que ainda está pendente de leitura ou resposta.
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
                <p className="font-medium text-foreground">Não foi possível carregar as automações</p>
                <p className="mt-1 text-sm text-muted-foreground">{erro instanceof Error ? erro.message : 'Erro desconhecido'}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={recarregar}>Tentar novamente</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Regras de automação</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Buscar regra, gatilho ou usuário…"
                  className="w-full pl-8 sm:w-72"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {painel.isLoading ? (
              <Carregando linhas={6} />
            ) : regras.length === 0 ? (
              <Vazio texto="Nenhuma regra de automação encontrada." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Regra</TableHead>
                      <TableHead>Dono</TableHead>
                      <TableHead>Gatilho</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Execuções</TableHead>
                      <TableHead className="text-right">Sucesso</TableHead>
                      <TableHead className="text-right">Falhas</TableHead>
                      <TableHead>Última execução</TableHead>
                      <TableHead>Último erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regras.map((linha: RegraAutomacaoRow, indice) => (
                      <TableRow key={`regra-${linha.rule_id ?? indice}`}>
                        <TableCell className="font-medium">{linha.rule_name ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{emailPorUsuario.get(linha.user_id ?? '') ?? '—'}</TableCell>
                        <TableCell>{linha.trigger_type ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={linha.is_active ? 'default' : 'secondary'}>{linha.is_active ? 'Ativa' : 'Inativa'}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.execution_count)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.successful_runs)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.failed_runs)}</TableCell>
                        <TableCell className="tabular-nums">{formatDataHora(linha.last_executed_at)}</TableCell>
                        <TableCell className="max-w-[18rem] truncate text-muted-foreground" title={linha.last_error ?? ''}>
                          {linha.last_error ?? '—'}
                        </TableCell>
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
              <CardTitle className="text-base">Notificações por usuário</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.notificacoes.length ?? 0) === 0 ? (
                <Vazio texto="Nenhum usuário com notificações." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead className="text-right">Não lidas</TableHead>
                        <TableHead className="text-right">Urgentes</TableHead>
                        <TableHead className="text-right">Lembretes hoje</TableHead>
                        <TableHead className="text-right">Atrasados</TableHead>
                        <TableHead>Canais</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dados?.notificacoes ?? []).map((linha: NotificacaoUsuarioRow) => (
                        <TableRow key={`notif-${linha.user_id ?? linha.email}`}>
                          <TableCell className="font-medium">{linha.email ?? '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(linha.unread_notifications)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(linha.urgent_notifications)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(linha.todays_reminders)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(linha.overdue_reminders)}</TableCell>
                          <TableCell className="space-x-1 whitespace-nowrap">
                            {linha.email_enabled ? <Badge variant="outline">e-mail</Badge> : null}
                            {linha.push_enabled ? <Badge variant="outline">push</Badge> : null}
                            {linha.daily_digest_enabled ? <Badge variant="outline">diário</Badge> : null}
                            {linha.weekly_digest_enabled ? <Badge variant="outline">semanal</Badge> : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canais de comunicação</CardTitle>
            </CardHeader>
            <CardContent>
              {painel.isLoading ? (
                <Carregando />
              ) : (dados?.canais.length ?? 0) === 0 ? (
                <Vazio texto="Nenhuma interação registrada." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">30 dias</TableHead>
                      <TableHead className="text-right">7 dias</TableHead>
                      <TableHead className="text-right">Empresas</TableHead>
                      <TableHead className="text-right">Contatos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dados?.canais ?? []).map((linha: CanalStatsRow, indice) => (
                      <TableRow key={`canal-${linha.channel ?? indice}`}>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            {linha.channel ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.total)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.ultimos_30d)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.ultimos_7d)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.empresas_distintas)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.contatos_distintos)}</TableCell>
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
            <CardTitle className="text-base">Progresso de apelidos por vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            {painel.isLoading ? (
              <Carregando />
            ) : (dados?.apelidos.length ?? 0) === 0 ? (
              <Vazio texto="Nenhum contato atribuído a vendedor." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">Contatos</TableHead>
                    <TableHead className="text-right">Com apelido</TableHead>
                    <TableHead className="text-right">Sem apelido</TableHead>
                    <TableHead className="w-[240px]">Preenchido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(dados?.apelidos ?? []).map((linha: ApelidoProgressoRow, indice) => {
                    const percentual = formatPercentual(linha.percentual_preenchido);
                    return (
                      <TableRow key={`apelido-${linha.vendedor ?? indice}`}>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                            {linha.vendedor ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.total_contatos)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.com_apelido)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(linha.sem_apelido)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={percentual} className="h-2" />
                            <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{percentual.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}