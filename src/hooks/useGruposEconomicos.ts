import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import type { Database } from '@/integrations/supabase/types';

export type GrupoEconomicoResumo = Database['public']['Views']['vw_grupos_economicos_resumo']['Row'];

export type GrupoSortKey = 'grupo_economico' | 'empresas' | 'clientes';

const TABLE = 'vw_grupos_economicos_resumo';
const CHUNK = 1000;

const SORT_COLUMN: Record<GrupoSortKey, string> = {
  grupo_economico: 'grupo_economico',
  empresas: 'total_empresas',
  clientes: 'clientes',
};

export interface GruposEconomicosParams {
  page: number;
  pageSize: number;
  search: string;
  tipo: string | null;
  incluirSemEmpresas: boolean;
  sortKey: GrupoSortKey;
  sortAsc: boolean;
}

type Filtro = { type: 'neq' | 'eq' | 'ilike'; column: string; value: unknown };

function filtrosComuns(incluirSemEmpresas: boolean): Filtro[] {
  return incluirSemEmpresas ? [] : [{ type: 'neq', column: 'total_empresas', value: 0 }];
}

function filtrosDaPagina({ search, tipo, incluirSemEmpresas }: GruposEconomicosParams): Filtro[] {
  const filtros = filtrosComuns(incluirSemEmpresas);
  if (tipo) filtros.push({ type: 'eq', column: 'tipo_grupo', value: tipo });
  const termo = search.trim();
  if (termo) filtros.push({ type: 'ilike', column: 'grupo_economico', value: `%${termo}%` });
  return filtros;
}

/** Página de grupos econômicos (paginação e ordenação no servidor). */
export function useGruposEconomicosPagina(params: GruposEconomicosParams) {
  return useQuery({
    queryKey: ['grupos-economicos', 'pagina', params],
    queryFn: async () => {
      const from = params.page * params.pageSize;
      const { data, count, error } = await queryExternalData<GrupoEconomicoResumo>({
        table: TABLE,
        select: '*',
        filters: filtrosDaPagina(params),
        order: { column: SORT_COLUMN[params.sortKey], ascending: params.sortAsc },
        range: { from, to: from + params.pageSize - 1 },
      });
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

export interface GruposEconomicosTotais {
  grupos: number;
  empresas: number;
  clientes: number;
  prospects: number;
  penetracao: number;
  tipos: string[];
}

/** Totais do recorte (todas as linhas, só 2 colunas) + tipos disponíveis para o filtro. */
export function useGruposEconomicosTotais(incluirSemEmpresas: boolean) {
  return useQuery({
    queryKey: ['grupos-economicos', 'totais', incluirSemEmpresas],
    queryFn: async (): Promise<GruposEconomicosTotais> => {
      const acc = { grupos: 0, empresas: 0, clientes: 0 };
      const tipos = new Set<string>();
      for (let from = 0; ; from += CHUNK) {
        const { data, error } = await queryExternalData<Pick<GrupoEconomicoResumo, 'total_empresas' | 'clientes' | 'tipo_grupo'>>({
          table: TABLE,
          select: 'total_empresas,clientes,tipo_grupo',
          filters: filtrosComuns(incluirSemEmpresas),
          range: { from, to: from + CHUNK - 1 },
        });
        if (error) throw error;
        const rows = data ?? [];
        for (const row of rows) {
          acc.grupos += 1;
          acc.empresas += row.total_empresas ?? 0;
          acc.clientes += row.clientes ?? 0;
          if (row.tipo_grupo) tipos.add(row.tipo_grupo);
        }
        if (rows.length < CHUNK) break;
      }
      const prospects = Math.max(acc.empresas - acc.clientes, 0);
      return {
        ...acc,
        prospects,
        penetracao: acc.empresas > 0 ? Math.round((acc.clientes / acc.empresas) * 100) : 0,
        tipos: Array.from(tipos).sort(),
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}