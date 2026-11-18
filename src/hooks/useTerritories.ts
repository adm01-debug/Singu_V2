import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';

/**
 * Territórios.
 *
 * Os três hooks deste arquivo estavam fora de contrato com o banco:
 *
 * - `get_territories()` devolve TABLE(territory_id, territory_name,
 *   manager_name, states, company_count, total_revenue). O tipo `Territory`
 *   declarava `id`, `name`, `region`, `state`, `city` e `assigned_to_name` —
 *   nenhum desses nomes chega, então a listagem, o filtro por UF e o mapa
 *   liam `undefined`.
 * - `get_territory_performance(p_territory_id uuid)` exige o argumento (sem
 *   valor padrão) e era chamada com `{}`; além disso devolve
 *   `companies`, `active_deals`, `pipeline_value`, `won_deals_month` e
 *   `revenue_month`, não `conversion_rate`/`total_revenue`.
 * - `create_territory` aborta com "This function is reserved for the service
 *   role" sempre que `auth.uid()` não é nulo, nas DUAS sobrecargas — e as
 *   duas têm exatamente os mesmos cinco nomes de argumento, o que torna
 *   qualquer chamada nomeada ambígua. Pelo front ela é inalcançável.
 *   A tabela `territories` tem policy `territories_all` com ALL para
 *   qualquer autenticado (USING e WITH CHECK `auth.uid() IS NOT NULL`),
 *   então a criação grava direto na tabela.
 */

export interface Territory {
  id: string;
  name: string;
  description?: string | null;
  region?: string | null;
  states: string[];
  cities: string[];
  manager_name?: string | null;
  company_count?: number;
  total_revenue?: number;
}

/** Retorno real de `get_territory_performance(p_territory_id)`. */
export interface TerritoryPerformance {
  territory_id: string;
  name: string;
  manager: string | null;
  companies: number;
  active_deals: number;
  pipeline_value: number;
  won_deals_month: number;
  revenue_month: number;
}

interface LinhaRpcTerritorio {
  territory_id: string;
  territory_name: string;
  manager_name: string | null;
  states: string[] | null;
  company_count: number | null;
  total_revenue: number | null;
}

interface LinhaTabelaTerritorio {
  id: string;
  description: string | null;
  cities: string[] | null;
  metadata: { region?: string } | null;
}

export function useTerritories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['territories', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Territory[]> => {
      // A RPC traz as contagens (empresas e receita ganha) que a tabela não
      // tem; a tabela traz descrição, cidades e região, que a RPC não devolve.
      const [{ data: rpc, error: rpcError }, tabela] = await Promise.all([
        callExternalRpc<LinhaRpcTerritorio[]>('get_territories', {}),
        supabase.from('territories').select('id, description, cities, metadata').eq('is_active', true),
      ]);
      if (rpcError) {
        logger.warn('[Territories] RPC error:', rpcError);
        return [];
      }
      if (tabela.error) logger.warn('[Territories] leitura da tabela falhou:', tabela.error);

      const extras = new Map<string, LinhaTabelaTerritorio>(
        ((tabela.data ?? []) as LinhaTabelaTerritorio[]).map(t => [t.id, t]),
      );

      return (Array.isArray(rpc) ? rpc : []).map(l => {
        const extra = extras.get(l.territory_id);
        return {
          id: l.territory_id,
          name: l.territory_name,
          description: extra?.description ?? null,
          region: extra?.metadata?.region ?? null,
          states: l.states ?? [],
          cities: extra?.cities ?? [],
          manager_name: l.manager_name,
          company_count: Number(l.company_count ?? 0),
          total_revenue: Number(l.total_revenue ?? 0),
        };
      });
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Performance de um território. A RPC é por território, não em lote. */
export function useTerritoriesPerformance(territoryIds: string[]) {
  const { user } = useAuth();
  const results = useQueries({
    queries: territoryIds.map(id => ({
      queryKey: ['territory-performance', id],
      enabled: !!user && !!id,
      staleTime: 10 * 60_000,
      retry: false,
      queryFn: async (): Promise<TerritoryPerformance | null> => {
        const { data, error } = await callExternalRpc<TerritoryPerformance>(
          'get_territory_performance',
          { p_territory_id: id },
        );
        if (error) {
          logger.warn('[TerritoryPerformance] erro:', error);
          return null;
        }
        return data;
      },
    })),
  });
  return results.map(r => r.data).filter((p): p is TerritoryPerformance => !!p);
}

export function useCreateTerritory() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (territory: {
      name: string;
      description?: string;
      state?: string;
      city?: string;
      region?: string;
      assigned_to?: string;
    }) => {
      if (!user) throw new Error('Não autenticado');
      const lista = (v?: string) => (v ?? '').split(',').map(s => s.trim()).filter(Boolean);
      const { data, error } = await supabase
        .from('territories')
        .insert({
          name: territory.name,
          description: territory.description ?? null,
          states: lista(territory.state),
          cities: lista(territory.city),
          manager_id: territory.assigned_to ?? null,
          is_active: true,
          // `region` não é coluna da tabela; fica em metadata para não se perder.
          metadata: territory.region ? { region: territory.region } : {},
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['territories'] });
      toast.success('Território criado com sucesso');
    },
    onError: (err) => {
      logger.error('[Territories] criação falhou:', err);
      toast.error('Erro ao criar território');
    },
  });
}
