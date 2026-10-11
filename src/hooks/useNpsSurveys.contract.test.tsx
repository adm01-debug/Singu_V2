import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useNpsSurveys } from './useNpsSurveys';

const mocks = vi.hoisted(() => ({ from: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'dono' } }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(),
    insert: vi.fn(), update: vi.fn(), maybeSingle: vi.fn(), then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.in, query.insert, query.update, query.maybeSingle]) {
    method.mockReturnValue(query);
  }
  return query;
}
let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult([]));
});
afterEach(() => client.clear());

describe('Contrato de pesquisas NPS', () => {
  it('cria um link NPS pendente sem simular entrega', async () => {
    const query = queryResult({ id: 'pesquisa', public_token: 'token' });
    const { result } = renderHook(() => useNpsSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    mocks.from.mockReturnValue(query);
    await act(async () => { await result.current.createSurvey({ contact_id: 'contato' }); });
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ survey_type: 'nps', status: 'pending' }));
    expect(query.insert.mock.calls[0][0]).not.toHaveProperty('sent_at');
    expect(query.insert.mock.calls[0][0]).not.toHaveProperty('score');
    expect(mocks.success).toHaveBeenCalledWith('Pesquisa criada! Compartilhe o link com o contato.');
  });
  it('usa a nota NPS zero nos indicadores e separa a consulta por tipo', async () => {
    const query = queryResult([{ status: 'answered', score: 0 }, { status: 'answered', score: 10 }, { status: 'pending', score: null }]);
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useNpsSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(query.select.mock.calls[0][0]).toContain('score:nps_score');
    expect(query.eq).toHaveBeenCalledWith('survey_type', 'nps');
    expect(result.current.metrics).toMatchObject({ answered: 2, pending: 1, promoters: 1, detractors: 1, npsScore: 0, avgScore: 5 });
  });
  it('não confirma resposta quando nenhuma linha é atualizada', async () => {
    const { result } = renderHook(() => useNpsSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    mocks.from.mockReturnValue(queryResult(null));
    await act(async () => { await expect(result.current.answerSurvey({ id: 'pesquisa', score: 10 })).rejects.toThrow('já respondida'); });
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it('grava nota zero no campo NPS e bloqueia reenvio', async () => {
    const { result } = renderHook(() => useNpsSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const query = queryResult({ id: 'pesquisa' });
    mocks.from.mockReturnValue(query);
    await act(async () => { await result.current.answerSurvey({ id: 'pesquisa', score: 0 }); });
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ nps_score: 0 }));
    expect(query.update.mock.calls[0][0]).not.toHaveProperty('score');
    expect(query.eq).toHaveBeenCalledWith('survey_type', 'nps');
    expect(query.in).toHaveBeenCalledWith('status', ['pending', 'sent']);
  });
});
