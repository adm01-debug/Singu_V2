import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMergeRecords } from '../useMergeRecords';
import { usePortfolioCompatibility } from '../usePortfolioCompatibility';

const mocks = vi.hoisted(() => ({ from: vi.fn(), user: { id: 'usuario-1' }, successToast: vi.fn(), errorToast: vi.fn(), warningToast: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: mocks.successToast, error: mocks.errorToast, warning: mocks.warningToast } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/hooks/useFuzzySearch', () => ({ useFuzzySearch: (items: unknown[]) => ({ results: items }) }));

function queryResult(data: unknown, error: Error | null = null) {
  const response = Promise.resolve({ data, error });
  const query = {
    select: vi.fn(), eq: vi.fn(), order: vi.fn(), limit: vi.fn(), update: vi.fn(),
    insert: vi.fn(), delete: vi.fn(), maybeSingle: vi.fn(), then: response.then.bind(response),
  };
  for (const method of [query.select, query.eq, query.order, query.limit, query.update, query.insert, query.delete, query.maybeSingle]) {
    method.mockReturnValue(query);
  }
  return query;
}

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mocks.from.mockReturnValue(queryResult([]));
});

describe('Mesclagem valida overrides antes de qualquer operação', () => {
  it('rejeita valores incompatíveis com o campo canônico', async () => {
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({
      entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides: { first_name: 17 },
    })).rejects.toMatchObject({ name: 'ZodError' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('não permite sobrescrever a coluna gerada full_name', async () => {
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({
      entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides: { full_name: 'Nome' },
    })).rejects.toMatchObject({ name: 'ZodError' });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('persiste overrides validados e os campos obrigatórios de auditoria', async () => {
    const contacts = queryResult([]);
    const audit = queryResult([]);
    mocks.from.mockImplementation(table => table === 'audit_log' ? audit : contacts);
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await result.current.mutateAsync({
      entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides: { email: 'contato@example.invalid' },
    });
    expect(contacts.update).toHaveBeenCalledWith({ email: 'contato@example.invalid' });
    expect(audit.insert).toHaveBeenCalledWith([expect.objectContaining({
      table_name: 'contacts', record_id: 'primario', new_data: { email: 'contato@example.invalid' },
    })]);
  });

  it('preserva a mesclagem concluída e avisa quando a auditoria adicional falha', async () => {
    const error = new Error('Falha na auditoria');
    const contacts = queryResult([]);
    mocks.from.mockImplementation(table => table === 'audit_log' ? queryResult([], error) : contacts);
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({ entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario' }))
      .resolves.toMatchObject({ primaryId: 'primario', secondaryId: 'secundario', auditFailed: true });
    expect(contacts.delete).toHaveBeenCalled();
    expect(mocks.warningToast).toHaveBeenCalledWith(expect.stringContaining('auditoria adicional'));
    expect(mocks.successToast).not.toHaveBeenCalled();
  });
});

describe('Compatibilidade não aceita um perfil fictício nem ignora consultas secundárias', () => {
  it('valida o JSON do perfil do vendedor e rejeita a falha ao recarregar', async () => {
    mocks.from.mockImplementation(table => queryResult(table === 'profiles' ? { nlp_profile: { vakProfile: 17 } } : []));
    const { result } = renderHook(() => usePortfolioCompatibility(), { wrapper });
    await waitFor(() => expect(result.current.error).toMatchObject({ name: 'ZodError' }));
    await act(async () => {
      await expect(result.current.loadData()).rejects.toMatchObject({ name: 'ZodError' });
    });
    expect(result.current.salespersonProfile).toBeNull();
  });

  it('expõe falha na consulta de VAK em vez de exibir compatibilidade artificial', async () => {
    const error = new Error('Falha na consulta VAK');
    mocks.from.mockImplementation(table => queryResult(table === 'profiles' ? { nlp_profile: null } : [],
      table === 'vak_analysis_history' ? error : null));
    const { result } = renderHook(() => usePortfolioCompatibility(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe(error));
    await act(async () => {
      await expect(result.current.loadData()).rejects.toBe(error);
    });
  });
});
