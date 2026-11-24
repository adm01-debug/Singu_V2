import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  APP_ROLES,
  ROLE_LABELS,
  canRemoveRole,
  describeRoleError,
  hasPermissionsMapped,
  rolesOfUser,
  usersWithoutRole,
  type AppRole,
  type RoleAssignment,
} from '@/lib/roleAssignment';

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean | null;
}

function nomeDoPerfil(perfil: ProfileRow): string {
  const nome = perfil.full_name?.trim();
  if (nome) return nome;
  return perfil.email?.trim() || perfil.id;
}

export default function RolesPage() {
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const queryClient = useQueryClient();
  const [selecao, setSelecao] = useState<Record<string, AppRole | undefined>>({});

  const { data: perfis = [], isLoading: perfisCarregando } = useQuery({
    queryKey: ['roles-perfis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_active')
        .order('full_name', { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ProfileRow[];
    },
    enabled: isAdmin,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: atribuicoes = [], isLoading: papeisCarregando } = useQuery({
    queryKey: ['all-user-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .limit(500);
      if (error) throw error;
      return (data ?? []) as RoleAssignment[];
    },
    enabled: isAdmin,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: permissoesPorPapel = {} } = useQuery({
    queryKey: ['role-permission-count'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('role').limit(500);
      if (error) throw error;
      const contagem: Record<string, number> = {};
      for (const linha of data ?? []) {
        const papel = String(linha.role);
        contagem[papel] = (contagem[papel] ?? 0) + 1;
      }
      return contagem;
    },
    enabled: isAdmin,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const invalidarPapeis = () => {
    void queryClient.invalidateQueries({ queryKey: ['all-user-roles'] });
    void queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    void queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
  };

  const atribuir = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: (_dados, variaveis) => {
      toast.success(`Papel ${ROLE_LABELS[variaveis.role]} atribuído.`);
      invalidarPapeis();
    },
    onError: (erro) => toast.error(describeRoleError(erro)),
  });

  const revogar = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('user_roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Papel revogado.');
      invalidarPapeis();
    },
    onError: (erro) => toast.error(describeRoleError(erro)),
  });

  const papeisPorUsuario = useMemo(() => {
    const mapa = new Map<string, AppRole[]>();
    for (const perfil of perfis) mapa.set(perfil.id, rolesOfUser(atribuicoes, perfil.id));
    return mapa;
  }, [perfis, atribuicoes]);

  const semPapel = useMemo(() => usersWithoutRole(perfis, atribuicoes), [perfis, atribuicoes]);

  if (adminLoading || (isAdmin && (perfisCarregando || papeisCarregando)))
    return <Skeleton className="h-64 m-6" />;
  if (!isAdmin) return <p className="p-6 text-muted-foreground">Acesso restrito a administradores.</p>;

  return (
    <>
      <Helmet>
        <title>Papéis · SINGU CRM</title>
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar papéis</h1>
          <p className="text-sm text-muted-foreground">
            Atribua e revogue papéis de acesso. As mudanças valem na próxima navegação do usuário.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{perfis.length}</p>
              <p className="text-xs text-muted-foreground">perfis</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{atribuicoes.length}</p>
              <p className="text-xs text-muted-foreground">papéis atribuídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{semPapel.length}</p>
              <p className="text-xs text-muted-foreground">sem papel</p>
            </CardContent>
          </Card>
        </div>

        {semPapel.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Quem não tem papel continua vendo todas as telas (a guarda de rota só restringe papel
            explícito). Atribua um papel para que as restrições passem a valer.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Permissões por papel</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {APP_ROLES.map((papel) => (
              <Badge key={papel} variant={hasPermissionsMapped(papel) ? 'secondary' : 'outline'}>
                {ROLE_LABELS[papel]}: {permissoesPorPapel[papel] ?? 0} permissões
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Usuários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {perfis.map((perfil) => {
              const papeis = papeisPorUsuario.get(perfil.id) ?? [];
              const papelSelecionado = selecao[perfil.id];
              return (
                <div
                  key={perfil.id}
                  className="flex flex-col gap-2 rounded border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {nomeDoPerfil(perfil)}
                      {perfil.is_active === false && (
                        <Badge variant="outline" className="ml-2">
                          inativo
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{perfil.email ?? perfil.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {papeis.length === 0 && <Badge variant="outline">sem papel</Badge>}
                    {papeis.map((papel) => {
                      const atribuicao = atribuicoes.find(
                        (a) => a.user_id === perfil.id && a.role === papel,
                      );
                      const podeRevogar = canRemoveRole(user?.id, perfil.id, papel);
                      return (
                        <Badge key={papel} variant="secondary" className="gap-1">
                          {ROLE_LABELS[papel]}
                          <button
                            type="button"
                            aria-label={`Revogar papel ${ROLE_LABELS[papel]} de ${nomeDoPerfil(perfil)}`}
                            className="ml-1 rounded px-1 hover:bg-muted disabled:opacity-40"
                            disabled={!atribuicao || !podeRevogar || revogar.isPending}
                            title={
                              podeRevogar
                                ? 'Revogar papel'
                                : 'Você não pode revogar seu próprio papel de administrador'
                            }
                            onClick={() => atribuicao && revogar.mutate({ id: atribuicao.id })}
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                    <Select
                      value={papelSelecionado}
                      onValueChange={(valor) =>
                        setSelecao((atual) => ({ ...atual, [perfil.id]: valor as AppRole }))
                      }
                    >
                      <SelectTrigger className="w-[190px]" aria-label={`Novo papel para ${nomeDoPerfil(perfil)}`}>
                        <SelectValue placeholder="Atribuir papel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_ROLES.map((papel) => (
                          <SelectItem
                            key={papel}
                            value={papel}
                            disabled={papeis.includes(papel)}
                          >
                            {ROLE_LABELS[papel]}
                            {hasPermissionsMapped(papel) ? '' : ' (sem permissões mapeadas)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      disabled={!papelSelecionado || atribuir.isPending}
                      onClick={() =>
                        papelSelecionado && atribuir.mutate({ userId: perfil.id, role: papelSelecionado })
                      }
                    >
                      Atribuir
                    </Button>
                  </div>
                </div>
              );
            })}
            {perfis.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum perfil encontrado.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}