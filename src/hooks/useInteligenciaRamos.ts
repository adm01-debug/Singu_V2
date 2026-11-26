import { useQuery } from '@tanstack/react-query';
import { callExternalRpc, queryExternalData } from '@/lib/externalData';

interface RamoBruto {
  ramo: string | null;
  quality_score?: number | null;
  leads?: number | null;
  revenue?: number | null;
}

export interface RamoConsolidado {
  ramo: string;
  empresas: number;
  conversao: number | null;
  receita: number;
}

export interface EmpresaDoRamo {
  id: string;
  nome_crm: string | null;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  status: string | null;
  is_customer: boolean | null;
}

const RAMO_NAO_INFORMADO = 'Não informado';

export function useRankingRamos() {
  return useQuery({
    queryKey: ['inteligencia-ramos'],
    queryFn: async () => {
      const [conversao, receita] = await Promise.all([
        callExternalRpc<RamoBruto[]>('get_best_industries', {}),
        callExternalRpc<RamoBruto[]>('get_industry_roi', {}),
      ]);
      if (conversao.error) throw conversao.error;
      if (receita.error) throw receita.error;

      const mapa = new Map<string, RamoConsolidado>();
      const chave = (ramo: string | null) => (ramo && ramo.trim() !== '' ? ramo : RAMO_NAO_INFORMADO);

      for (const linha of receita.data ?? []) {
        const nome = chave(linha.ramo);
        mapa.set(nome, {
          ramo: nome,
          empresas: Number(linha.leads ?? 0),
          conversao: null,
          receita: Number(linha.revenue ?? 0),
        });
      }
      for (const linha of conversao.data ?? []) {
        const nome = chave(linha.ramo);
        const atual = mapa.get(nome) ?? { ramo: nome, empresas: 0, conversao: null, receita: 0 };
        atual.conversao = linha.quality_score === null || linha.quality_score === undefined
          ? null
          : Number(linha.quality_score);
        mapa.set(nome, atual);
      }

      return Array.from(mapa.values()).sort((a, b) => b.empresas - a.empresas);
    },
    staleTime: 10 * 60_000,
  });
}

export function useEmpresasDoRamo(ramo: string | null) {
  return useQuery({
    queryKey: ['inteligencia-ramos-empresas', ramo],
    enabled: !!ramo,
    queryFn: async () => {
      const alvo = ramo as string;
      const { data, count, error } = await queryExternalData<EmpresaDoRamo>({
        table: 'companies',
        select: 'id, nome_crm, nome_fantasia, razao_social, cnpj, status, is_customer',
        filters: alvo === RAMO_NAO_INFORMADO
          ? [{ type: 'is', column: 'ramo_atividade', value: null }]
          : [{ type: 'eq', column: 'ramo_atividade', value: alvo }],
        order: [{ column: 'is_customer', ascending: false }, { column: 'nome_crm', ascending: true }],
        range: { from: 0, to: 24 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { empresas: data ?? [], total: count ?? 0 };
    },
    staleTime: 5 * 60_000,
  });
}