import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCSATSurveys } from './useCSATSurveys';

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

describe('Contrato de pesquisas CSAT', () => {
  it('consulta apenas CSAT do dono e contato, mantendo a escala de satisfação', async () => {
    const query = queryResult([{ status: 'answered', score: 1 }, { status: 'answered', score: 5 }, { status: 'pending', score: null }]);
    mocks.from.mockReturnValue(query);
    const { result } = renderHook(() => useCSATSurveys('contato'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(query.eq).toHaveBeenCalledWith('user_id', 'dono');
    expect(query.eq).toHaveBeenCalledWith('survey_type', 'csat');
    expect(query.eq).toHaveBeenCalledWith('contact_id', 'contato');
    expect(result.current.stats).toMatchObject({ total: 3, answered: 2, avgScore: 3, responseRate: 67 });
  });

  it('cria uma pesquisa pendente sem inventar nota ou entrega', async () => {
    const { result } = renderHook(() => useCSATSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const query = queryResult(null);
    mocks.from.mockReturnValueOnce(query);
    await act(async () => { await result.current.send.mutateAsync({ contactId: 'contato' }); });
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'dono', contact_id: 'contato', survey_type: 'csat', status: 'pending' }));
    expect(query.insert.mock.calls[0][0]).not.toHaveProperty('score');
    expect(query.insert.mock.calls[0][0]).not.toHaveProperty('sent_at');
    expect(mocks.success).toHaveBeenCalledWith('Pesquisa CSAT criada!');
  });

  it.each([0, 6, 1.5, NaN])('rejeita a nota inválida %s antes de gravar', async score => {
    const { result } = renderHook(() => useCSATSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    mocks.from.mockClear();
    await act(async () => { await expect(result.current.answer.mutateAsync({ id: 'pesquisa', score })).rejects.toThrow('inteiro entre 1 e 5'); });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('não confirma uma resposta que não atualizou uma pesquisa aberta CSAT', async () => {
    const { result } = renderHook(() => useCSATSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const query = queryResult(null);
    mocks.from.mockReturnValueOnce(query);
    await act(async () => { await expect(result.current.answer.mutateAsync({ id: 'pesquisa', score: 5 })).rejects.toThrow('já respondida'); });
    expect(query.eq).toHaveBeenCalledWith('user_id', 'dono');
    expect(query.eq).toHaveBeenCalledWith('survey_type', 'csat');
    expect(query.eq).toHaveBeenCalledWith('id', 'pesquisa');
    expect(query.in).toHaveBeenCalledWith('status', ['pending', 'sent']);
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.maybeSingle).toHaveBeenCalledOnce();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it('confirma a resposta somente após o banco retornar a linha gravada', async () => {
    const { result } = renderHook(() => useCSATSurveys(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const query = queryResult({ id: 'pesquisa' });
    mocks.from.mockReturnValueOnce(query);
    await act(async () => { await result.current.answer.mutateAsync({ id: 'pesquisa', score: 1, feedback: 'Precisa melhorar' }); });
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ score: 1, feedback: 'Precisa melhorar', status: 'answered' }));
    expect(query.update.mock.calls[0][0]).not.toHaveProperty('nps_score');
    expect(mocks.success).toHaveBeenCalledWith('Resposta registrada!');
  });
});
