import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AlertTriangle, ClipboardCheck, Copy, ExternalLink, Search, ShieldAlert } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ROTULO_CAMPO,
  useCnpjsDuplicados,
  useCnpjsInvalidos,
  useEmpresasIncompletas,
  usePendenciasQualidade,
} from '@/hooks/useQualidadeCadastral';

const POR_PAGINA = 25;

const formatNumero = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : valor.toLocaleString('pt-BR');

const formatPct = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? '—' : `${valor}%`;

const corDaNota = (nota: number | null | undefined) => {
  if (nota === null || nota === undefined) return 'secondary' as const;
  if (nota >= 80) return 'secondary' as const;
  if (nota >= 60) return 'outline' as const;
  return 'destructive' as const;
};

function Paginacao({ pagina, total, onMudar }: { pagina: number; total: number; onMudar: (pagina: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <p className="text-xs text-muted-foreground">Página {pagina} de {paginas} · {formatNumero(total)} registro(s)</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)}>Anterior</Button>
        <Button variant="outline" size="sm" disabled={pagina >= paginas} onClick={() => onMudar(pagina + 1)}>Próxima</Button>
      </div>
    </div>
  );
}

function CnpjInvalidoTab() {
  const { data, isLoading, error } = useCnpjsInvalidos();
  const [busca, setBusca] = useState('');
  const [problema, setProblema] = useState('todos');
  const [pagina, setPagina] = useState(1);

  const problemas = useMemo(() => {
    const tipos = new Map<string, number>();
    (data ?? []).forEach((linha) => {
      const chave = linha.issue ?? 'Sem classificação';
      tipos.set(chave, (tipos.get(chave) ?? 0) + 1);
    });
    return [...tipos.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);

  const filtrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (data ?? []).filter((linha) => {
      if (problema !== 'todos' && (linha.issue ?? 'Sem classificação') !== problema) return false;
      if (!termo) return true;
      return (linha.name ?? '').toLowerCase().includes(termo) || (linha.cnpj ?? '').toLowerCase().includes(termo);
    });
  }, [data, busca, problema]);

  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtrado.length / POR_PAGINA)));
  const visiveis = filtrado.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-start gap-3 py-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os CNPJs inválidos: {error instanceof Error ? error.message : 'erro desconhecido'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          Empresas com CNPJ inválido ({formatNumero(data?.length)})
        </CardTitle>
        <CardDescription>
          Lista limitada a 1.000 empresas por consulta. Use a busca para localizar um cadastro específico.
        </CardDescription>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(evento) => { setBusca(evento.target.value); setPagina(1); }}
              placeholder="Buscar por empresa ou CNPJ"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={problema === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setProblema('todos'); setPagina(1); }}
            >
              Todos ({formatNumero(data?.length)})
            </Button>
            {problemas.map(([tipo, quantidade]) => (
              <Button
                key={tipo}
                variant={problema === tipo ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setProblema(tipo); setPagina(1); }}
              >
                {tipo} ({formatNumero(quantidade)})
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
          </div>
        ) : visiveis.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada com esse filtro.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ atual</TableHead>
                    <TableHead>Problema</TableHead>
                    <TableHead className="text-right">Abrir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((linha) => (
                    <TableRow key={linha.company_id}>
                      <TableCell className="font-medium">{linha.name ?? '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{linha.cnpj || <span className="text-muted-foreground">vazio</span>}</TableCell>
                      <TableCell><Badge variant="destructive">{linha.issue ?? 'Sem classificação'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/empresas/${linha.company_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginacao pagina={paginaAtual} total={filtrado.length} onMudar={setPagina} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CnpjDuplicadoTab() {
  const { data, isLoading, error } = useCnpjsDuplicados();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return data ?? [];
    return (data ?? []).filter((linha) => (linha.cnpj ?? '').toLowerCase().includes(termo));
  }, [data, busca]);

  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtrado.length / POR_PAGINA)));
  const visiveis = filtrado.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const empresasEnvolvidas = useMemo(
    () => (data ?? []).reduce((total, linha) => total + Number(linha.count ?? 0), 0),
    [data],
  );

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-start gap-3 py-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os CNPJs duplicados: {error instanceof Error ? error.message : 'erro desconhecido'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Copy className="h-4 w-4 text-muted-foreground" />
          CNPJ repetido em mais de uma empresa ({formatNumero(data?.length)} grupos · {formatNumero(empresasEnvolvidas)} empresas)
        </CardTitle>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(evento) => { setBusca(evento.target.value); setPagina(1); }}
            placeholder="Buscar por CNPJ"
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
          </div>
        ) : visiveis.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum CNPJ repetido encontrado.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CNPJ</TableHead>
                    <TableHead className="text-right">Empresas</TableHead>
                    <TableHead>Cadastros envolvidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((linha) => (
                    <TableRow key={linha.cnpj}>
                      <TableCell className="font-mono text-xs">{linha.cnpj}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumero(linha.count)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(linha.company_ids ?? []).map((id) => (
                            <Button key={id} asChild variant="outline" size="sm">
                              <Link to={`/empresas/${id}`}>{id.slice(0, 8)}</Link>
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginacao pagina={paginaAtual} total={filtrado.length} onMudar={setPagina} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function IncompletasTab() {
  const { data, isLoading, error } = useEmpresasIncompletas();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);

  const filtrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return data ?? [];
    return (data ?? []).filter((linha) => (linha.company_name ?? '').toLowerCase().includes(termo));
  }, [data, busca]);

  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtrado.length / POR_PAGINA)));
  const visiveis = filtrado.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-start gap-3 py-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os cadastros incompletos: {error instanceof Error ? error.message : 'erro desconhecido'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          Cadastros incompletos ({formatNumero(data?.length)})
        </CardTitle>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(evento) => { setBusca(evento.target.value); setPagina(1); }}
            placeholder="Buscar por empresa"
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, indice) => <Skeleton key={indice} className="h-10 w-full" />)}
          </div>
        ) : visiveis.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada com esse filtro.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Campos faltando</TableHead>
                    <TableHead className="text-right">Completude</TableHead>
                    <TableHead className="text-right">Abrir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((linha) => (
                    <TableRow key={linha.company_id}>
                      <TableCell className="font-medium">{linha.company_name ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(linha.missing_fields ?? []).map((campo) => (
                            <Badge key={campo} variant="outline">{ROTULO_CAMPO[campo] ?? campo}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={corDaNota(linha.completeness_pct)}>{formatPct(linha.completeness_pct)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/empresas/${linha.company_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Paginacao pagina={paginaAtual} total={filtrado.length} onMudar={setPagina} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function QualidadeCadastral() {
  const [aba, setAba] = useState('cnpj-invalido');
  const pendencias = usePendenciasQualidade();

  const total = pendencias.data?.companies_total ?? 0;
  const semCnpj = pendencias.data?.companies_without_cnpj ?? 0;
  const coberturaCnpj = total > 0 ? Math.round(((total - semCnpj) / total) * 100) : null;

  const kpis = [
    {
      titulo: 'Cobertura de CNPJ',
      valor: coberturaCnpj === null ? '—' : `${coberturaCnpj}%`,
      detalhe: `${formatNumero(total - semCnpj)} de ${formatNumero(total)} empresas`,
    },
    {
      titulo: 'Empresas sem CNPJ',
      valor: formatNumero(pendencias.data?.companies_without_cnpj),
      detalhe: 'CNPJ vazio ou fora do padrão',
    },
    {
      titulo: 'Empresas sem e-mail',
      valor: formatNumero(pendencias.data?.companies_without_email),
      detalhe: `de ${formatNumero(total)} empresas`,
    },
    {
      titulo: 'Sem responsável',
      valor: formatNumero(pendencias.data?.companies_without_owner),
      detalhe: `${formatNumero(pendencias.data?.contacts_orphans)} contatos órfãos`,
    },
  ];

  const carregandoKpis = pendencias.isLoading;

  return (
    <AppLayout>
      <Helmet>
        <title>Qualidade cadastral | SINGU</title>
        <meta
          name="description"
          content="Nota de completude da base, empresas com CNPJ inválido ou repetido e cadastros com campos faltando."
        />
      </Helmet>

      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Qualidade cadastral</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              O que está faltando ou errado no cadastro das empresas — e quanto isso pesa na nota da base.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { void pendencias.refetch(); }}
            disabled={pendencias.isFetching}
          >
            {pendencias.isFetching ? 'Atualizando…' : 'Atualizar'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.titulo}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.titulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {carregandoKpis ? <Skeleton className="h-7 w-16" /> : kpi.valor}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.detalhe}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={aba} onValueChange={setAba}>
          <TabsList>
            <TabsTrigger value="cnpj-invalido">CNPJ inválido</TabsTrigger>
            <TabsTrigger value="cnpj-duplicado">CNPJ repetido</TabsTrigger>
            <TabsTrigger value="incompletas">Cadastro incompleto</TabsTrigger>
          </TabsList>

          <TabsContent value="cnpj-invalido" className="mt-4">
            <CnpjInvalidoTab />
          </TabsContent>
          <TabsContent value="cnpj-duplicado" className="mt-4">
            <CnpjDuplicadoTab />
          </TabsContent>
          <TabsContent value="incompletas" className="mt-4">
            <IncompletasTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}