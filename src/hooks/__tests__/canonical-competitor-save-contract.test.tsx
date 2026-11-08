import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpsertCompetitor } from '../useWinLoss';

const mocks = vi.hoisted(() => ({ from: vi.fn(), toastError: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));

const saved = { id: 'concorrente-1', name: 'Concorrente', website: null, strengths: [], weaknesses: [], is_active: true, metadata: {} };
function competitorQuery() {
  return {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), upsert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { metadata: {} }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: saved, error: null }),
  };
}
function recordsQuery(error: Error | null = null) {
  const response = Promise.resolve({ data: [], error });
  return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), then: response.then.bind(response) };
}
function renderMutation() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return renderHook(() => useUpsertCompetitor(), {
    wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
}
beforeEach(() => vi.resetAllMocks());

describe('gravação de concorrentes', () => {
  it('não grava quando a consulta prévia das métricas falha', async () => {
    const competitor = competitorQuery();
    const failure = new Error('Métricas indisponíveis');
    mocks.from.mockImplementation((table: string) => table === 'competitors' ? competitor : recordsQuery(failure));
    const { result } = renderMutation();
    await act(async () => {
      await expect(result.current.mutateAsync({ id: saved.id, name: saved.name })).rejects.toBe(failure);
    });
    expect(competitor.upsert).not.toHaveBeenCalled();
    expect(mocks.toastError).toHaveBeenCalledWith('Erro ao salvar concorrente');
  });

  it('confirma a criação sem depender de uma consulta posterior de métricas', async () => {
    const competitor = competitorQuery();
    mocks.from.mockImplementation((table: string) => {
      if (table !== 'competitors') throw new Error('Consulta de métricas indisponível');
      return competitor;
    });
    const { result } = renderMutation();
    await act(async () => {
      await expect(result.current.mutateAsync({ name: saved.name })).resolves.toMatchObject({ id: saved.id, name: saved.name });
    });
    expect(competitor.upsert).toHaveBeenCalledOnce();
    expect(mocks.toastError).not.toHaveBeenCalled();
  });
});
