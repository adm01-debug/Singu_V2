import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as externalData from '@/lib/externalData';
import { useDailyKpis } from './useDailyKpis';

const mocks = vi.hoisted(() => ({ isAdmin: false }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

vi.mock('@/hooks/useIsAdmin', () => ({
  useIsAdmin: () => ({ isAdmin: mocks.isAdmin, isLoading: false }),
}));

vi.mock('@/lib/externalData', () => ({
  queryExternalData: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useDailyKpis', () => {
  beforeEach(() => {
    mocks.isAdmin = false;
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('não consulta métricas globais para usuário comum', () => {
    const { result } = renderHook(() => useDailyKpis(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(externalData.queryExternalData).not.toHaveBeenCalled();
  });

  it('consulta métricas globais para administrador', async () => {
    mocks.isAdmin = true;
    vi.mocked(externalData.queryExternalData).mockResolvedValue({
      data: [{ total_revenue: 100 }],
      count: 1,
      error: null,
    });

    const { result } = renderHook(() => useDailyKpis(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.total_revenue).toBe(100);
    expect(externalData.queryExternalData).toHaveBeenCalledWith(
      expect.objectContaining({ table: 'mv_daily_kpis' }),
    );
  });
});
