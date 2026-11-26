import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, KeyRound, Search, UserCheck, Users } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ROTULO_SITUACAO,
  TIPOS_CONTA_WORKSPACE,
  situacaoConta,
  useWorkspaces,
  type ContaWorkspaceRow,
  type SituacaoConta,
} from '@/hooks/useWorkspaces';

const TAMANHO_PAGINA = 25;

const formatNumber = (valor: number) => valor.toLocaleString('pt-BR');

const formatDataHora = (valor: string | null | undefined) => {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '—';
  return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
};

const CLASSE_SITUACAO: Record<SituacaoConta, string> = {
  admin: 'border-amber-500/60 text-amber-600 dark:text-amber-400',
  ativo: 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400',
  inativo: 'border-muted-foreground/40 text-muted-foreground',
  suspenso: 'border-destructive/60 text-destructive',
  grupo: 'border-sky-500/60 text-sky-600 dark:text-sky-400',
};

function Vinculos({ conta }: { conta: ContaWorkspaceRow }) {
  const itens = useMemo(() => {
    const lista: string[] = [];
    if (conta.contact_id) lista.push('contato');
    if (conta.company_id) lista.push('empresa');
    if (conta.user_id !== null && conta.user_id !== undefined) lista.push('usuário do sistema');
    return lista;
  }, [conta]);

  if (itens.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {itens.map((item) => (
        <Badge key={item} variant="secondary" className="text-xs font-normal">{item}</Badge>
      ))}
    </div>
  );
}

export default function Workspaces() {
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

  const consulta = useWorkspaces({ busca, tipo });

  const contas = useMemo(() => consulta.data?.contas ?? [], [consulta.data?.contas]);

  const kpis = useMemo(() => {
    const usuarios = contas.filter((conta) => conta.account_type === 'user');
    return {
      total: consulta.data?.total ?? 0,
      usuarios: usuarios.length,
      ativos: usuarios.filter((conta) => situacaoConta(conta) === 'ativo').length,
      admins: usuarios.filter((conta) => conta.is_admin).length,
      grupos: contas.filter((conta) => conta.account_type === 'group').length,
      suspensos: usuarios.filter((conta) => conta.is_suspended).length,
    };
  }, [contas, consulta.data?.total]);

  const paginas = Math.max(Math.ceil(contas.length / TAMANHO_PAGINA), 1);
  const paginaAtual = Math.min(pagina, paginas - 1);
  const visiveis = contas.slice(paginaAtual * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA + TAMANHO_PAGINA);

  const cartoes = [
    { titulo: 'Contas sincronizadas', valor: kpis.total, icone: Users, detalhe: 'diretório do Google Workspace' },
    { titulo: 'Usuários ativos', valor: kpis.ativos, icone: UserCheck, detalhe: `${formatNumber(kpis.suspensos)} suspensos` },
    { titulo: 'Grupos', valor: kpis.grupos, icone: Building2, detalhe: 'listas de distribuição' },
    { titulo: 'Administradores', valor: kpis.admins, icone: KeyRound, detalhe: 'acesso administrativo no Google' },
  ];

  return (
    <AppLayout>
      <Helmet>
        <title>Contas do Workspace | SINGU</title>
        <meta
          name="description"
          content="Monitor das contas e grupos sincronizados do Google Workspace: situação, departamento, aliases, último acesso e vínculos."
        />
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contas do Google Workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Diretório sincronizado do Workspace: quem existe, em que grupo está, quando acessou e o que já está vinculado a contatos e empresas do CRM.
          </p>
        </div>

        {consulta.error ? (
          <Card className="border-destructive/40">
            <CardContent className="flex items-start gap-3 py-6">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-foreground">Não foi possível carregar as contas do Workspace</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {consulta.error instanceof Error ? consulta.error.message : 'Erro desconhecido'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cartoes.map((cartao) => (
              <Card key={cartao.titulo}>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{cartao.titulo}</CardTitle>
                  <cartao.icone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {consulta.isLoading ? <Skeleton className="h-7 w-16" /> : formatNumber(cartao.valor)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{cartao.detalhe}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Diretório ({formatNumber(contas.length)})</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ordenado por tipo e e-mail; use a busca por e-mail ou nome.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={buscaInput}
                    onChange={(evento) => setBuscaInput(evento.target.value)}
                    placeholder="Buscar e-mail ou nome…"
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
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {TIPOS_CONTA_WORKSPACE.map((item) => (
                      <SelectItem key={item.valor} value={item.valor}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {consulta.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, indice) => (
                  <Skeleton key={indice} className="h-10 w-full" />
                ))}
              </div>
            ) : visiveis.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma conta encontrada para os filtros atuais.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conta</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Departamento / cargo</TableHead>
                        <TableHead>Aliases</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead>Último acesso</TableHead>
                        <TableHead>Vínculos</TableHead>
                        <TableHead>Sincronizado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visiveis.map((conta) => {
                        const situacao = situacaoConta(conta);
                        return (
                          <TableRow key={conta.id}>
                            <TableCell>
                              <div className="font-medium">{conta.email ?? '—'}</div>
                              <div className="text-xs text-muted-foreground">
                                {conta.display_name ?? conta.account_type ?? '—'}
                                {conta.org_unit_path ? ` · ${conta.org_unit_path}` : ''}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={CLASSE_SITUACAO[situacao]}>
                                {ROTULO_SITUACAO[situacao]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {[conta.department, conta.job_title].filter(Boolean).join(' · ') || '—'}
                            </TableCell>
                            <TableCell className="text-sm">{formatNumber(conta.aliases?.length ?? 0)}</TableCell>
                            <TableCell className="text-sm">
                              {conta.account_type === 'group' ? formatNumber(conta.member_count ?? 0) : '—'}
                            </TableCell>
                            <TableCell className="text-sm">{formatDataHora(conta.last_login_at)}</TableCell>
                            <TableCell><Vinculos conta={conta} /></TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDataHora(conta.synced_at)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Página {paginaAtual + 1} de {paginas}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina(Math.max(paginaAtual - 1, 0))}
                      disabled={paginaAtual === 0}
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagina(Math.min(paginaAtual + 1, paginas - 1))}
                      disabled={paginaAtual >= paginas - 1}
                    >
                      Próxima <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}