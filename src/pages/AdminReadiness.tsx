import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, CheckCircle2, Database, RefreshCw, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { resumirReadiness, useSinguReadiness } from '@/hooks/useSinguReadiness';

type Filtro = 'todos' | 'com-dados' | 'vazias';

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export default function AdminReadiness() {
  const { data, isLoading, isError, error, refetch, isFetching } = useSinguReadiness();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busca, setBusca] = useState('');

  const linhas = useMemo(() => data ?? [], [data]);
  const resumo = useMemo(() => resumirReadiness(linhas), [linhas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter((linha) => {
      const comDados = (linha.status ?? '').startsWith('OK');
      if (filtro === 'com-dados' && !comDados) return false;
      if (filtro === 'vazias' && comDados) return false;
      if (termo && !(linha.tabela ?? '').toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [linhas, filtro, busca]);

  const kpis = [
    { titulo: 'Tabelas monitoradas', valor: formatNumber(resumo.total), icone: Database, detalhe: 'objetos acompanhados pela view de readiness' },
    { titulo: 'Com dados', valor: formatNumber(resumo.comDados), icone: CheckCircle2, detalhe: `${resumo.percentual}% do total` },
    { titulo: 'Vazias', valor: formatNumber(resumo.vazias), icone: AlertTriangle, detalhe: 'estrutura pronta, sem nenhum registro' },
    { titulo: 'Registros somados', valor: formatNumber(resumo.registros), icone: Database, detalhe: 'volume total das tabelas com dados' },
  ];

  return (
    <AppLayout>
      <Helmet>
        <title>Readiness dos dados | SINGU</title>
        <meta name="description" content="Estado real de cada tabela do SINGU: quantos registros existem e quais módulos ainda estão vazios." />
      </Helmet>

      <div className="container mx-auto max-w-7xl space-y-6 py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Readiness dos dados</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quantos registros cada tabela entrega de verdade. Tabela marcada como vazia tem estrutura e permissão prontas, mas nenhum dado gravado.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
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
                  {isLoading ? <Skeleton className="h-7 w-20" /> : kpi.valor}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.detalhe}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Cobertura de dados</CardTitle>
              <span className="text-sm text-muted-foreground">
                {resumo.comDados}/{resumo.total}
              </span>
            </div>
            <Progress value={resumo.percentual} className="h-2" />
          </CardHeader>
        </Card>

        {isError ? (
          <Card className="border-destructive/40">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Não foi possível carregar o readiness</p>
                <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>Tentar novamente</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-base">Tabelas ({formatNumber(filtradas.length)})</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Buscar tabela…"
                    className="w-full pl-8 sm:w-64"
                  />
                </div>
                <Select value={filtro} onValueChange={(valor) => setFiltro(valor as Filtro)}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    <SelectItem value="com-dados">Com dados</SelectItem>
                    <SelectItem value="vazias">Vazias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, indice) => (
                  <Skeleton key={indice} className="h-10 w-full" />
                ))}
              </div>
            ) : filtradas.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tabela encontrada para este filtro.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabela</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtradas.map((linha, indice) => {
                      const comDados = (linha.status ?? '').startsWith('OK');
                      return (
                        <TableRow key={`${linha.tabela ?? 'sem-nome'}-${indice}`}>
                          <TableCell className="font-mono text-sm">{linha.tabela ?? '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatNumber(Number(linha.registros ?? 0))}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={comDados ? 'default' : 'outline'}
                              className={comDados ? '' : 'border-amber-500/60 text-amber-600 dark:text-amber-400'}
                            >
                              {comDados ? 'Com dados' : 'Vazia'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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