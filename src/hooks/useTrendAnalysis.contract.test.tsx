import { createElement, type PropsWithChildren } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useTrendAnalysis } from './useReportsAnalytics';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono-relatorio' } }) }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: vi.fn() }));

function renderTrend(months?: number) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useTrendAnalysis(months), {
    wrapper: ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children),
  });
}

describe('Contrato da tendência mensal', () => {
  beforeEach(() => { vi.mocked(callExternalRpc).mockResolvedValue({ data: null, error: null }); });
  afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

  it('converte a série `tendencia_empresas` do jsonb em pontos do gráfico', async () => {
    vi.mocked(callExternalRpc).mockResolvedValue({
      data: {
        periodo_meses: 3,
        tendencia_empresas: [
          { mes: '2026-02-01', novas_empresas: 10 },
          { mes: '2026-03-01', novas_empresas: 25 },
          { mes: '2026-04-01', novas_empresas: 4 },
        ],
      },
      error: null,
    });
    const { result } = renderTrend(3);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callExternalRpc).toHaveBeenCalledWith('get_trend_analysis', { p_months: 3 });
    expect(result.current.data).toEqual([
      { period: '02/26', value: 10, trend: 'stable' },
      { period: '03/26', value: 25, trend: 'up' },
      { period: '04/26', value: 4, trend: 'down' },
    ]);
  });

  it('devolve lista vazia quando a RPC não traz a série', async () => {
    vi.mocked(callExternalRpc).mockResolvedValue({
      data: { periodo_meses: 6, tendencia_empresas: null, tendencia_interacoes: null },
      error: null,
    });
    const { result } = renderTrend(6);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('expõe a falha da RPC sem apresentar dados de sucesso', async () => {
    const error = new Error('Consulta indisponível');
    vi.mocked(callExternalRpc).mockResolvedValue({ data: null, error });
    const { result } = renderTrend(6);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});