import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Clock, Coins, Database, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  JANELAS_TELEMETRIA,
  useParticoesGatewayIA,
  useSaudeGatewayIA,
  type CelulaHeatmapGateway,
} from '@/hooks/useTelemetriaIA';

const LIMITE_ERRO_PCT = 5;
const LIMITE_P95_MS = 8000;

const formatNumero = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : Math.round(valor).toLocaleString('pt-BR');

const formatMs = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : `${Math.round(valor).toLocaleString('pt-BR')} ms`;

const formatPct = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : `${Number(valor).toFixed(1).replace('.', ',')}%`;

const formatBytes = (bytes: number | null | undefined) => {
  if (!bytes) return '—';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} kB`;
  return `${mb.toFixed(1).replace('.', ',')} MB`;
};

const formatDataHora = (valor: string | null | undefined) => {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

function corDaTaxa(percentual: number | null | undefined) {
  if (percentual === null || percentual === undefined) return 'secondary' as const;
  if (percentual >= LIMITE_ERRO_PCT) return 'destructive' as const;
  if (percentual > 0) return 'outline' as const;
  return 'secondary' as const;
}

function CelulaHeatmap({ celula }: { celula: CelulaHeatmapGateway }) {
  const critica = (celula.error_rate_pct ?? 0) >= LIMITE_ERRO_PCT;
  return (
    <div
      className={`rounded-md border px-2 py-1 text-center text-xs tabular-nums ${
        critica ? 'border-destructive/60 bg-destructive/10 text-destructive' : 'border-border text-muted-foreground'
      }`}
      title={`${celula.errors} erro(s) em ${celula.requests} chamada(s)`}
    >
      {formatPct(celula.error_rate_pct)}
    </div>
  );
}

export function TelemetriaGateway() {
  const [janela, setJanela] = useState('24');
  const horas = JANELAS_TELEMETRIA.find((item) => item.valor === janela)?.horas ?? 24;
  const saude = useSaudeGatewayIA(horas);
  const particoes = useParticoesGatewayIA();

  const totais = saude.data?.totals;
  const funcoes = useMemo(() => saude.data?.by_function ?? [], [saude.data]);
  const modelos = useMemo(() => saude.data?.by_model ?? [], [saude.data]);
  const heatmap = useMemo(
    () => [...(saude.data?.error_heatmap ?? [])].sort((a, b) => (a.dow - b.dow) || (a.hour - b.hour)),
    [saude.data],
  );
  const listaParticoes = useMemo(() => particoes.data ?? [], [particoes.data]);

  const alertasAtivos = saude.data?.active_alerts?.length ?? 0;
  const taxaErroAlta = (totais?.error_rate_pct ?? 0) >= LIMITE_ERRO_PCT;
  const latenciaAlta = (totais?.p95_ms ?? 0) >= LIMITE_P95_MS;

  const kpis = [
    { titulo: 'Chamadas de IA', valor: formatNumero(totais?.requests), detalhe: JANELAS_TELEMETRIA.find((i) => i.valor === janela)?.label ?? '', icone: Activity },
    { titulo: 'Taxa de erro', valor: formatPct(totais?.error_rate_pct), detalhe: `${formatNumero(totais?.errors)} falha(s)`, icone: AlertTriangle },
    { titulo: 'Latência p95', valor: formatMs(totais?.p95_ms), detalhe: `p50 ${formatMs(totais?.p50_ms)}`, icone: Clock },
    { titulo: 'Tokens', valor: formatNumero((totais?.tokens_in ?? 0) + (totais?.tokens_out ?? 0)), detalhe: `${formatNumero(totais?.tokens_in)} entrada / ${formatNumero(totais?.tokens_out)} saída`, icone: Coins },
  ];

  const recarregar = () => {
    void saude.refetch();
    void particoes.refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Tempo real do gateway de IA: volume, falhas, latência e tokens por função e por modelo.
        </p>
        <div className="flex items-center gap-2">
          <Select value={janela} onValueChange={setJanela}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Janela de análise">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JANELAS_TELEMETRIA.map((item) => (
                <SelectItem key={item.valor} value={item.valor}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={recarregar} disabled={saude.isFetching || particoes.isFetching}>
            {saude.isFetching || particoes.isFetching ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {saude.error && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 py-6">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Não foi possível carregar a telemetria do gateway</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {saude.error instanceof Error ? saude.error.message : 'Erro desconhecido'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.titulo}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
              <kpi.icone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {saude.isLoading ? <Skeleton className="h-7 w-16" /> : kpi.valor}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.detalhe}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(taxaErroAlta || latenciaAlta || alertasAtivos > 0) && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Sinais de problema na janela selecionada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {taxaErroAlta && (
              <p>Taxa de erro em {formatPct(totais?.error_rate_pct)}, acima do limite de {LIMITE_ERRO_PCT}% que dispara alerta automático.</p>
            )}
            {latenciaAlta && (
              <p>Latência p95 em {formatMs(totais?.p95_ms)}, acima do limite de {formatMs(LIMITE_P95_MS)}.</p>
            )}
            {alertasAtivos > 0 && <p>{alertasAtivos} alerta(s) de IA abertos no sistema.</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por função ({funcoes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {saude.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
              </div>
            ) : funcoes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma chamada de IA nesta janela.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-right">Chamadas</TableHead>
                      <TableHead className="text-right">Erros</TableHead>
                      <TableHead className="text-right">p95</TableHead>
                      <TableHead>Última</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcoes.map((linha) => (
                      <TableRow key={linha.function_name}>
                        <TableCell className="font-mono text-xs">{linha.function_name}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumero(linha.requests)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={corDaTaxa(linha.error_rate_pct)}>
                            {formatNumero(linha.errors)} · {formatPct(linha.error_rate_pct)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMs(linha.p95_ms)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDataHora(linha.last_seen)}</TableCell>
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
            <CardTitle className="text-base">Por modelo ({modelos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {saude.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
              </div>
            ) : modelos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum modelo acionado nesta janela.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modelo</TableHead>
                      <TableHead className="text-right">Chamadas</TableHead>
                      <TableHead className="text-right">Erros</TableHead>
                      <TableHead className="text-right">p95</TableHead>
                      <TableHead className="text-right">Tokens (in/out)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelos.map((linha) => (
                      <TableRow key={linha.model}>
                        <TableCell className="font-mono text-xs">{linha.model}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumero(linha.requests)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={corDaTaxa(linha.error_rate_pct)}>
                            {formatNumero(linha.errors)} · {formatPct(linha.error_rate_pct)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMs(linha.p95_ms)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {formatNumero(linha.tokens_in)} / {formatNumero(linha.tokens_out)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {heatmap.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Falhas por dia da semana e hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead className="text-right">Chamadas</TableHead>
                    <TableHead className="text-right">Erros</TableHead>
                    <TableHead className="text-center">Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmap.map((celula) => (
                    <TableRow key={`${celula.dow}-${celula.hour}`}>
                      <TableCell className="capitalize">{DIAS_SEMANA[celula.dow] ?? `dia ${celula.dow}`}</TableCell>
                      <TableCell className="tabular-nums">{String(celula.hour).padStart(2, '0')}h</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumero(celula.requests)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumero(celula.errors)}</TableCell>
                      <TableCell>
                        <CelulaHeatmap celula={celula} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-muted-foreground" />
            Partições da telemetria ({listaParticoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {particoes.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
            </div>
          ) : particoes.error ? (
            <p className="py-4 text-sm text-destructive">
              {particoes.error instanceof Error ? particoes.error.message : 'Falha ao carregar partições.'}
            </p>
          ) : listaParticoes.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma partição encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partição</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-right">Linhas (est.)</TableHead>
                    <TableHead className="text-right">Tamanho</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaParticoes.map((particao) => (
                    <TableRow key={particao.partition_name}>
                      <TableCell className="font-mono text-xs">{particao.partition_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDataHora(particao.range_start)} → {formatDataHora(particao.range_end)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumero(particao.estimated_rows)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBytes(particao.total_bytes)}</TableCell>
                      <TableCell className="space-x-1">
                        {particao.is_current && <Badge>Atual</Badge>}
                        {particao.is_future && <Badge variant="outline">Futura</Badge>}
                        {particao.is_expiring && <Badge variant="destructive">Expirando</Badge>}
                        {!particao.is_current && !particao.is_future && !particao.is_expiring && (
                          <Badge variant="secondary">Histórica</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Server className="h-3 w-3" />
        Limites de alerta automático: {LIMITE_ERRO_PCT}% de erro ou p95 ≥ {formatMs(LIMITE_P95_MS)} em janelas com pelo menos 20 chamadas.
        {saude.data?.computed_at && ` Calculado em ${formatDataHora(saude.data.computed_at)}.`}
      </p>
    </div>
  );
}