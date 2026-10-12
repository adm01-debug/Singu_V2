import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryExternalData } from '@/lib/externalData';
import { useErpStats } from './useErpData';

vi.mock('@/lib/externalData', () => ({ queryExternalData: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());

describe('Indicadores ERP com falha parcial', () => {
  it.each(['products', 'proposals'])('preserva a origem saudável quando %s falha', async failing => {
    vi.mocked(queryExternalData).mockImplementation(async query => {
      const product = ['vw_produtos', 'produtos', 'vw_products', 'products'].includes(query.table);
      if ((product ? 'products' : 'proposals') === failing) return { data: null, count: null, error: new Error('Indisponível') };
      return { data: product ? [{ id: 'produto', ativo: true }] : [{ id: 'proposta', valor_total: 250 }], count: 1, error: null };
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useErpStats(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.productsState.isError).toBe(failing === 'products');
    expect(result.current.proposalsState.isError).toBe(failing === 'proposals');
    if (failing === 'products') {
      expect(result.current.stats.totalProposals).toBe(1);
      expect(result.current.stats.proposalsValueSum).toBe(250);
    } else {
      expect(result.current.stats.totalProducts).toBe(1);
      expect(result.current.stats.activeProducts).toBe(1);
    }
    client.clear();
  });
});
