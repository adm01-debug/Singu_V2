import { useQuery } from '@tanstack/react-query';
import { invokeWithTrace } from '@/lib/supabaseInvoke';
import { logger } from '@/lib/logger';

interface DistinctResponse { values?: string[] }
interface BatchDistinctResponse { results?: Record<string, string[]> }

async function fetchDistinctValues(table: string, column: string): Promise<string[]> {
  const { data, error, traceId } = await invokeWithTrace<DistinctResponse>('external-data', {
    body: { action: 'distinct', table, column },
  });

  if (error) {
    logger.error(`Failed to fetch distinct ${column}:`, { traceId, error: error.message });
    return [];
  }

  return data?.values || [];
}

export function useExternalLookup(table: string, column: string, enabled = true) {
  return useQuery({
    queryKey: ['external-lookup', table, column],
    queryFn: () => fetchDistinctValues(table, column),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/** Fetch multiple distinct columns in a single Edge Function call */
async function fetchBatchDistinct(table: string, columns: string[]): Promise<Record<string, string[]>> {
  const { data, error, traceId } = await invokeWithTrace<BatchDistinctResponse>('external-data', {
    body: { action: 'batch_distinct', table, columns },
  });

  if (error) {
    logger.error('Failed to fetch batch distinct:', { traceId, error: error.message });
    return {};
  }

  return data?.results || {};
}

export function useExternalBatchLookup(table: string, columns: string[], enabled = true) {
  return useQuery({
    queryKey: ['external-batch-lookup', table, ...columns],
    queryFn: () => fetchBatchDistinct(table, columns),
    enabled,
    staleTime: 30 * 60 * 1000, // 30 min — filter options rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
