import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { AlertTriangle, Building2, Filter, Gauge, Percent, Timer, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFunilVendas } from '@/hooks/useFunilVendas';

const ROTULO_ESTAGIO: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificando: 'Qualificando',
  qualificado: 'Qualificado',
  negociacao: 'Negociação',
  proposta: 'Proposta',
  fechamento: 'Fechamento',
  cliente: 'Cliente',
  perdido: 'Perdido',
};

const ROTULO_CANAL: Record<string, string> = {
  sistema: 'Sistema',
  comercial: 'Comercial',
  email: 'E-mail',
  redes_sociais: 'Redes sociais',
  whatsapp: 'WhatsApp',
};

const ROTULO_METRICA: Record<string, string> = {
  avg_cycle_days: 'Ciclo médio',
  min_cycle_days: 'Ciclo mínimo',
  max_cycle_days: 'Ciclo máximo',
  median_cycle_days: 'Ciclo mediano',
};

const CORES = ['#2563eb', '#0ea5e9', '#14b8a6', '#22c55e', '#eab308', '#f97316', '#ef4444', '#a855f7', '#64748b'];

const formatNumero = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : valor.toLocaleString('pt-BR');

const formatMoeda = (valor: number | null | undefined) => {
  if (valor === null || valor === undefined) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
};

const formatPct = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

const formatDias = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dia(s)`;

const formatMes = (valor: string | null | undefined) => {
  if (!valor) return '—';
  const [ano, mes] = valor.split('-');
  return ano && mes ? `${mes}/${ano.slice(2)}` : valor;
};

function KpiCard({
  titulo, valor, detalhe, Icone, carregando,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  Icone: typeof Gauge;
  carregando: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <span className="rounded-md bg-muted p-2 text-muted-foreground">
          <Icone className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{titulo}</p>
          {carregando ? (
            <Skeleton className="mt-1 h-7 w-24" />
          ) : (
            <p className="truncate text-xl font-semibold tabular-nums" title={valor}>{valor}</p>
          )}
          <p className="truncate text-xs text-muted-foreground" title={detalhe}>{detalhe}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FunilVendas() {
  const { data, isLoading, error, refetch, isFetching } = useFunilVendas();

  const estagios = useMemo(
    () => (data?.funil ?? [])
      .slice()
      .sort((a, b) => a.stage_order - b.stage_order)
      .map((linha) => ({ ...linha, nome: ROTULO_ESTAGIO[linha.stage] ?? linha.stage })),
    [data],
  );

  const entrada = useMemo(
    () => estagios.find((linha) => linha.stage_order === 1) ?? estagios[0],
    [estagios],
  );
  const clientes = useMemo(() => estagios.find((linha) => linha.stage === 'cliente'), [estagios]);
  const perdidos = useMemo(() => estagios.find((linha) => linha.stage === 'perdido'), [estagios]);
  const pipeline = useMemo(
    () => estagios.reduce((soma, linha) => soma + Number(linha.value ?? 0), 0),
    [estagios],
  );
  const etapasComMovimento = useMemo(
    () => estagios.filter((linha) => linha.stage_order > 1 && Number(linha.count) > 0).length,
    [estagios],
  );

  const canais = useMemo(
    () => (data?.canais ?? [])
      .slice()
      .sort((a, b) => Number(b.conversion_rate ?? 0) - Number(a.conversion_rate ?? 0)),
    [data],
  );
  const melhorCanal = canais[0];

  const ciclo = useMemo(
    () => (data?.ciclo ?? []).map((linha) => ({
      ...linha,
      nome: ROTULO_METRICA[linha.metric] ?? linha.metric,
    })),
    [data],
  );
  const cicloSemDados = ciclo.every((linha) => Number(linha.value ?? 0) === 0);

  const ltv = useMemo(
    () => (data?.ltv ?? [])
      .map((linha) => ({ ...linha, nome: linha.segment ?? 'Sem segmento' }))
      .sort((a, b) => Number(b.company_count ?? 0) - Number(a.company_count ?? 0)),
    [data],
  );
  const ltvTotal = useMemo(
    () => ltv.reduce((soma, linha) => soma + Number(linha.total_ltv ?? 0), 0),
    [ltv],
  );

  return (
    <AppLayout>
      <Helmet>
        <title>Funil e ciclo de vendas · Singu</title>
      </Helmet>
      <div className="space-y-6 p-4 md:p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Funil e ciclo de vendas</h1>
            <p className="text-sm text-muted-foreground">
              Onde a base está parada no funil, qual canal converte, quanto dura o ciclo e quanto vale cada segmento.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { void refetch(); }} disabled={isFetching}>
            {isFetching ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </header>

        {error ? (
          <Card>
            <CardContent className="py-8 text-sm text-destructive">
              Não foi possível carregar o funil de vendas: {error instanceof Error ? error.message : 'erro desconhecido'}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                titulo="Entrada do funil"
                valor={formatNumero(entrada?.count)}
                detalhe={entrada ? `estágio “${entrada.nome}”` : 'sem estágios'}
                Icone={Filter}
                carregando={isLoading}
              />
              <KpiCard
                titulo="Clientes"
                valor={formatNumero(clientes?.count)}
                detalhe="empresas no estágio cliente"
                Icone={Building2}
                carregando={isLoading}
              />
              <KpiCard
                titulo="Perdidos"
                valor={formatNumero(perdidos?.count)}
                detalhe="empresas no estágio perdido"
                Icone={AlertTriangle}
                carregando={isLoading}
              />
              <KpiCard
                titulo="Pipeline em valor"
                valor={formatMoeda(pipeline)}
                detalhe="soma do valor por estágio"
                Icone={Wallet}
                carregando={isLoading}
              />
            </div>

            {!isLoading && etapasComMovimento === 0 && (
              <Card>
                <CardContent className="flex items-start gap-3 py-4 text-sm text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    Nenhuma empresa foi movida além da entrada — as etapas seguintes aparecem zeradas porque o
                    funil ainda não recebeu classificação de estágio, não por falha de leitura.
                  </span>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="gap-1">
                <CardTitle className="text-base">Empresas por estágio</CardTitle>
                <CardDescription>
                  {isLoading ? 'Carregando…' : `${formatNumero(entrada?.count)} na entrada · ${estagios.length} estágios mapeados`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[340px] w-full" />
                ) : estagios.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Nenhum estágio retornado pelo funil.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={estagios} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="nome" width={112} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(valor: unknown) => formatNumero(Number(valor))} />
                      <Bar dataKey="count" name="Empresas" radius={[0, 4, 4, 0]}>
                        {estagios.map((linha, indice) => (
                          <Cell key={linha.stage} fill={CORES[indice % CORES.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Conversão por canal
                  </CardTitle>
                  <CardDescription>
                    {melhorCanal
                      ? `Melhor canal: ${ROTULO_CANAL[melhorCanal.channel] ?? melhorCanal.channel} (${formatPct(melhorCanal.conversion_rate)})`
                      : 'Sem canais registrados'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
                    </div>
                  ) : canais.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum canal com primeiro contato registrado.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Canal</TableHead>
                          <TableHead className="text-right">Primeiros contatos</TableHead>
                          <TableHead className="text-right">Convertidos</TableHead>
                          <TableHead>Conversão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {canais.map((linha) => (
                          <TableRow key={linha.channel}>
                            <TableCell className="font-medium">{ROTULO_CANAL[linha.channel] ?? linha.channel}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumero(linha.first_contact_count)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumero(linha.converted_count)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${Math.min(100, Math.max(0, Number(linha.conversion_rate ?? 0)))}%` }}
                                  />
                                </div>
                                <span className="tabular-nums text-xs text-muted-foreground">{formatPct(linha.conversion_rate)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    Ciclo de vendas
                  </CardTitle>
                  <CardDescription>
                    {cicloSemDados && !isLoading ? 'Sem negócios fechados suficientes para medir o ciclo.' : 'Do primeiro contato ao fechamento'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-16 w-full" />)}
                    </div>
                  ) : ciclo.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma métrica de ciclo retornada.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {ciclo.map((linha) => (
                        <div key={linha.metric} className="rounded-lg border p-3">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">{linha.nome}</p>
                          <p className="text-lg font-semibold tabular-nums">{formatDias(linha.value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">Retenção por coorte</CardTitle>
                  <CardDescription>Empresas que continuam ativas em cada mês após a entrada</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
                    </div>
                  ) : (data?.coortes.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma coorte calculada ainda.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Coorte</TableHead>
                          <TableHead className="text-right">M0</TableHead>
                          <TableHead className="text-right">M1</TableHead>
                          <TableHead className="text-right">M2</TableHead>
                          <TableHead className="text-right">M3</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data?.coortes ?? []).map((linha) => (
                          <TableRow key={linha.cohort_month}>
                            <TableCell className="font-medium tabular-nums">{formatMes(linha.cohort_month)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumero(linha.m0)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumero(linha.m1)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumero(linha.m2)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatNumero(linha.m3)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">LTV por segmento</CardTitle>
                  <CardDescription>
                    {isLoading ? 'Carregando…' : `Valor total acumulado: ${formatMoeda(ltvTotal)}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-[240px] w-full" />
                  ) : ltv.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">Nenhum segmento com LTV calculado.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={ltv}
                            dataKey="company_count"
                            nameKey="nome"
                            innerRadius={48}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {ltv.map((linha, indice) => (
                              <Cell key={linha.segment} fill={CORES[indice % CORES.length]} />
                            ))}
                          </Pie>
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Tooltip formatter={(valor: unknown) => formatNumero(Number(valor))} />
                        </PieChart>
                      </ResponsiveContainer>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Segmento</TableHead>
                            <TableHead className="text-right">Empresas</TableHead>
                            <TableHead className="text-right">LTV médio</TableHead>
                            <TableHead className="text-right">LTV total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ltv.map((linha) => (
                            <TableRow key={linha.segment}>
                              <TableCell>
                                <Badge variant="outline">{linha.nome}</Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{formatNumero(linha.company_count)}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatMoeda(linha.avg_ltv)}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatMoeda(linha.total_ltv)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}