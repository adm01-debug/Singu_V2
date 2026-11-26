import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export const TIPOS_CONTA_WORKSPACE = [
  { valor: 'user', label: 'Usuários' },
  { valor: 'group', label: 'Grupos' },
] as const;

export interface ContaWorkspaceRow {
  id: string;
  email: string | null;
  display_name: string | null;
  account_type: string | null;
  department: string | null;
  job_title: string | null;
  is_active: boolean | null;
  is_admin: boolean | null;
  is_suspended: boolean | null;
  aliases: string[] | null;
  member_count: number | null;
  org_unit_path: string | null;
  last_login_at: string | null;
  contact_id: string | null;
  company_id: string | null;
  user_id: number | null;
  synced_at: string | null;
}

const CAMPOS =
  'id, email, display_name, account_type, department, job_title, is_active, is_admin, is_suspended, aliases, member_count, org_unit_path, last_login_at, contact_id, company_id, user_id, synced_at';

export type SituacaoConta = 'admin' | 'suspenso' | 'inativo' | 'grupo' | 'ativo';

export function situacaoConta(conta: ContaWorkspaceRow): SituacaoConta {
  if (conta.account_type === 'group') return 'grupo';
  if (conta.is_suspended) return 'suspenso';
  if (conta.is_admin) return 'admin';
  if (conta.is_active === false) return 'inativo';
  return 'ativo';
}

export const ROTULO_SITUACAO: Record<SituacaoConta, string> = {
  admin: 'Admin',
  suspenso: 'Suspenso',
  inativo: 'Inativo',
  grupo: 'Grupo',
  ativo: 'Ativo',
};

interface ParametrosWorkspaces {
  busca: string;
  tipo: string;
}

export function useWorkspaces({ busca, tipo }: ParametrosWorkspaces) {
  const termo = busca.trim();
  return useQuery({
    queryKey: ['workspaces-contas', termo, tipo],
    queryFn: async () => {
      const { data, count, error } = await queryExternalData<ContaWorkspaceRow>({
        table: 'workspace_accounts',
        select: CAMPOS,
        filters: tipo === 'todos' ? undefined : [{ type: 'eq', column: 'account_type', value: tipo }],
        search: termo ? { term: termo, columns: ['email', 'display_name'], matchAllTerms: false } : undefined,
        order: [
          { column: 'account_type', ascending: true },
          { column: 'email', ascending: true },
        ],
        range: { from: 0, to: 499 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { contas: data ?? [], total: count ?? 0 };
    },
    staleTime: 60_000,
  });
}