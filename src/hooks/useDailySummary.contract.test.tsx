import { createElement, type PropsWithChildren } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useDailySummary } from './useDailySummary';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono-relatorio' } }) }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: vi.fn() }));

function renderSummary(date?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useDailySummary(date), {
    wrapper: ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children),
  });
}

describe('Contrato do dia e fuso do resumo diário', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const options = new Intl.DateTimeFormat().resolvedOptions();
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions')
      .mockReturnValue({ ...options, timeZone: 'America/Sao_Paulo' });
    vi.mocked(callExternalRpc).mockResolvedValue({ data: null, error: null });
  });

  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks(); });

  it.each([
    ['2026-10-12T02:59:59Z', '2026-10-11'],
    ['2026-10-12T03:00:00Z', '2026-10-12'],
  ])('usa o dia brasileiro no instante %s', async (instant, date) => {
    vi.setSystemTime(new Date(instant));
    const { result } = renderSummary();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callExternalRpc).toHaveBeenCalledWith('get_daily_summary', {
      p_date: date, p_timezone: 'America/Sao_Paulo',
    });
  });

  it('preserva a data selecionada ao consultar um dia anterior', async () => {
    vi.setSystemTime(new Date('2026-10-12T02:59:59Z'));
    const { result } = renderSummary('2026-09-30');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callExternalRpc).toHaveBeenCalledWith('get_daily_summary', {
      p_date: '2026-09-30', p_timezone: 'America/Sao_Paulo',
    });
  });

  it('expõe a falha da RPC sem apresentar dados de sucesso', async () => {
    const error = new Error('Consulta indisponível');
    vi.mocked(callExternalRpc).mockResolvedValue({ data: null, error });
    const { result } = renderSummary('2026-10-11');
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
  });
});
