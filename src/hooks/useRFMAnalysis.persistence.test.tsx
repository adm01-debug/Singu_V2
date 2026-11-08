import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useRFMAnalysis } from './useRFMAnalysis';

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), log: vi.fn(), purchaseError: null as Error | null }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono' } }) }));
vi.mock('@/hooks/useContacts', () => ({ useContacts: () => ({ contacts: [{ id: 'contato' }] }) }));
vi.mock('@/hooks/useInteractions', () => ({ useInteractions: () => ({ interactions: [] }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: mocks.rpc }));
vi.mock('@/lib/logger', () => ({ logger: { error: mocks.log } }));

function queryResult(error: Error | null = null) {
  const response = Promise.resolve({ data: [], error });
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), then: response.then.bind(response) };
  for (const method of [query.select, query.eq, query.order, query.limit]) method.mockReturnValue(query);
  return query;
}
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.purchaseError = null;
  mocks.rpc.mockResolvedValue({ data: 1, error: null });
  mocks.from.mockImplementation((table: string) => queryResult(table === 'purchase_history' ? mocks.purchaseError : null));
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => client.clear());

describe('Persistência RFM do painel', () => {
  it('envia segment_code e salva análise com histórico por uma única RPC', async () => {
    const { result } = renderHook(() => useRFMAnalysis(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await result.current.runAnalysis(); });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).toHaveBeenCalledWith('persist_rfm_analysis', {
      _rows: [expect.objectContaining({ user_id: 'dono', contact_id: 'contato', segment_code: expect.any(String) })],
    });
    const row = mocks.rpc.mock.calls[0][1]._rows[0];
    expect(row.segment_code).toBe(row.segment);
    expect(result.current.analyzing).toBe(false);
  });
  it('propaga erro da RPC sem invalidar dados como se houvesse sucesso', async () => {
    const failure = new Error('falha no histórico');
    mocks.rpc.mockResolvedValue({ data: null, error: failure });
    const invalidation = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useRFMAnalysis(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await expect(result.current.runAnalysis()).rejects.toBe(failure); });
    expect(invalidation).not.toHaveBeenCalled();
    expect(result.current.analyzing).toBe(false);
  });
  it('interrompe a análise quando a leitura de compras falha', async () => {
    const failure = new Error('compras indisponíveis');
    mocks.purchaseError = failure;
    const { result } = renderHook(() => useRFMAnalysis(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await expect(result.current.runAnalysis()).rejects.toBe(failure); });
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(result.current.analyzing).toBe(false);
  });
  it('rejeita uma resposta de persistência com contagem incompleta', async () => {
    mocks.rpc.mockResolvedValue({ data: 0, error: null });
    const { result } = renderHook(() => useRFMAnalysis(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { await expect(result.current.runAnalysis()).rejects.toThrow('Persistência RFM incompleta'); });
    expect(result.current.analyzing).toBe(false);
  });
});
