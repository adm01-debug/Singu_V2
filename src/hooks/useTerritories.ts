import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useAuth } from './useAuth';

export interface Territory {
  id: string;
  name: string;
  description?: string;
  region?: string;
  state?: string;
  city?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  company_count?: number;
  contact_count?: number;
  deal_count?: number;
  total_revenue?: number;
  created_at?: string;
}

export interface TerritoryPerformance {
  territory_id: string;
  territory_name: string;
  total_deals: number;
  won_deals: number;
  total_revenue: number;
  conversion_rate: number;
  avg_deal_size: number;
  active_companies: number;
}

export function useTerritories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['territories', user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<Territory[]>('get_territories', {});
        if (error) {
          logger.warn('[Territories] RPC error:', error);
          return [];
        }
        return Array.isArray(data) ? data : [];
      } catch (e) {
        logger.warn('[Territories] Fetch failed:', e);
        return [];
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useTerritoryPerformance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['territory-performance', user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<TerritoryPerformance[]>(
          'get_territory_performance', {}
        );
        if (error) {
          logger.warn('[TerritoryPerformance] RPC not available:', error);
          return [];
        }
        return Array.isArray(data) ? data : [];
      } catch (e) {
        logger.warn('[TerritoryPerformance] Fetch failed:', e);
        return [];
      }
    },
    staleTime: 10 * 60_000,
    retry: false,
  });
}

export function useCreateTerritory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (territory: Partial<Territory>) => {
      const { data, error } = await callExternalRpc('create_territory', { p_territory: territory });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['territories'] });
      toast.success('Território criado com sucesso');
    },
    onError: () => toast.error('Erro ao criar território'),
  });
}
