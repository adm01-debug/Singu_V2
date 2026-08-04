import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface TerritoryRecommendation {
  type: 'reassign' | 'split' | 'merge' | 'hire' | 'rebalance';
  territory_id: string | null;
  territory_name: string;
  action: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TerritoryChartPoint {
  name: string;
  empresas: number;
  contatos: number;
  deals: number;
}

export interface TerritoryStatusRow {
  id: string;
  name: string;
  state?: string | null;
  assigned_to_name?: string | null;
  company_count: number;
  deal_count: number;
  conversion_rate: number;
  status: 'healthy' | 'underserved' | 'overserved' | 'unassigned';
}

export interface TerritoryOptimizationResult {
  healthScore: number;
  coverage: number;
  giniIndex: number;
  avgConversion: number;
  totalTerritories: number;
  assignedCount: number;
  underservedCount: number;
  overservedCount: number;
  recommendations: TerritoryRecommendation[];
  chartData: TerritoryChartPoint[];
  tableData: TerritoryStatusRow[];
  analyzedAt: string;
}

const EMPTY: TerritoryOptimizationResult = {
  healthScore: 0,
  coverage: 0,
  giniIndex: 0,
  avgConversion: 0,
  totalTerritories: 0,
  assignedCount: 0,
  underservedCount: 0,
  overservedCount: 0,
  recommendations: [],
  chartData: [],
  tableData: [],
  analyzedAt: new Date().toISOString(),
};

export function useTerritoryOptimization() {
  return useQuery({
    queryKey: ['territory-optimization'],
    queryFn: async (): Promise<TerritoryOptimizationResult> => {
      try {
        const { data, error } = await supabase.functions.invoke('territory-optimization', {
          body: {},
        });
        if (error) {
          logger.warn('[TerritoryOptimization] error:', error);
          return EMPTY;
        }
        if (!data || typeof data !== 'object') return EMPTY;
        return {
          ...EMPTY,
          ...(data as TerritoryOptimizationResult),
          recommendations: Array.isArray((data as TerritoryOptimizationResult).recommendations)
            ? (data as TerritoryOptimizationResult).recommendations
            : [],
          chartData: Array.isArray((data as TerritoryOptimizationResult).chartData)
            ? (data as TerritoryOptimizationResult).chartData
            : [],
          tableData: Array.isArray((data as TerritoryOptimizationResult).tableData)
            ? (data as TerritoryOptimizationResult).tableData
            : [],
        };
      } catch (e) {
        logger.warn('[TerritoryOptimization] fetch failed:', e);
        return EMPTY;
      }
    },
    staleTime: 10 * 60_000,
    retry: false,
  });
}
