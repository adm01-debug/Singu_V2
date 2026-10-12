import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { logger } from '@/lib/logger';

export interface ErpProduct {
  id: string | number;
  codigo?: string | null;
  nome?: string | null;
  descricao?: string | null;
  preco?: number | null;
  unidade?: string | null;
  categoria?: string | null;
  ativo?: boolean | null;
  estoque?: number | null;
  [k: string]: unknown;
}

export interface ErpProposal {
  id: string | number;
  numero?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  status?: string | null;
  valor_total?: number | null;
  data_emissao?: string | null;
  data_validade?: string | null;
  vendedor?: string | null;
  itens_count?: number | null;
  [k: string]: unknown;
}

const CANDIDATE_PRODUCT_TABLES = ['vw_produtos', 'produtos', 'vw_products', 'products'];
const CANDIDATE_PROPOSAL_TABLES = ['vw_propostas', 'propostas', 'vw_proposals'];

async function tryFetch<T>(tables: string[], limit: number, filters?: Parameters<typeof queryExternalData>[0]['filters']): Promise<T[]> {
  let lastError = new Error('Não foi possível consultar os dados do ERP.');
  for (const table of tables) {
    try {
      const { data, error } = await queryExternalData<T>({
        table,
        select: '*',
        range: { from: 0, to: limit - 1 },
        filters,
      });
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Resposta inválida do ERP.');
      return data;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('Não foi possível consultar os dados do ERP.');
      logger.warn(`[ERP] Table ${table} unavailable:`, e);
    }
  }
  throw lastError;
}

export function useErpProducts(limit = 100, search?: string) {
  return useQuery({
    queryKey: ['erp-products', limit, search],
    queryFn: async () => {
      const data = await tryFetch<ErpProduct>(CANDIDATE_PRODUCT_TABLES, limit);
      if (!search) return data;
      const s = search.toLowerCase();
      return data.filter(p =>
        (p.nome ?? '').toLowerCase().includes(s) ||
        (p.codigo ?? '').toLowerCase().includes(s) ||
        (p.categoria ?? '').toLowerCase().includes(s)
      );
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useErpProposals(limit = 100, companyId?: string) {
  return useQuery({
    queryKey: ['erp-proposals', limit, companyId],
    queryFn: async () => {
      const filters = companyId
        ? [{ type: 'eq' as const, column: 'cliente_id', value: companyId }]
        : undefined;
      return tryFetch<ErpProposal>(CANDIDATE_PROPOSAL_TABLES, limit, filters);
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export interface ErpStats {
  totalProducts: number;
  totalProposals: number;
  proposalsValueSum: number;
  activeProducts: number;
}

export function useErpStats() {
  const products = useErpProducts(500);
  const proposals = useErpProposals(500);

  const stats: ErpStats = {
    totalProducts: products.data?.length ?? 0,
    activeProducts: products.data?.filter(p => p.ativo !== false).length ?? 0,
    totalProposals: proposals.data?.length ?? 0,
    proposalsValueSum: (proposals.data ?? []).reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0),
  };

  return {
    stats,
    isLoading: products.isLoading || proposals.isLoading,
    isError: products.isError || proposals.isError,
    productsState: { isLoading: products.isLoading, isError: products.isError },
    proposalsState: { isLoading: proposals.isLoading, isError: proposals.isError },
  };
}
