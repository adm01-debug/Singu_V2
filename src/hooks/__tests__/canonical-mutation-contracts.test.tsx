import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMergeRecords } from '../useMergeRecords';
import { useMergeCompanies } from '../useCompanyActions';
import { usePortfolioCompatibility } from '../usePortfolioCompatibility';

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), user: { id: 'usuario-1' }, successToast: vi.fn(), errorToast: vi.fn(), warningToast: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: mocks.successToast, error: mocks.errorToast, warning: mocks.warningToast } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: mocks.rpc }));
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
  mocks.rpc.mockResolvedValue({ data: { success: true, primary_id: 'primario', secondary_id: 'secundario' }, error: null });
});

describe('Mesclagem valida overrides antes de qualquer operação', () => {
  it('rejeita valores incompatíveis com o campo canônico', async () => {
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({
      entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides: { first_name: 17 },
    })).rejects.toMatchObject({ name: 'ZodError' });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('não permite sobrescrever a coluna gerada full_name', async () => {
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({
      entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides: { full_name: 'Nome' },
    })).rejects.toMatchObject({ name: 'ZodError' });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('envia overrides validados à transação de mesclagem e auditoria', async () => {
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await result.current.mutateAsync({
      entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides: { email: 'contato@example.invalid' },
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('merge_records_atomically', {
      p_entity: 'contacts', p_primary_id: 'primario', p_secondary_id: 'secundario',
      p_field_overrides: { email: 'contato@example.invalid' },
    });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.successToast).toHaveBeenCalledWith('Registros mesclados com sucesso');
  });

  it('não anuncia mesclagem concluída quando a auditoria transacional falha', async () => {
    const error = new Error('Falha na auditoria');
    mocks.rpc.mockResolvedValueOnce({ data: null, error });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({ entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario' }))
      .rejects.toBe(error);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.errorToast).toHaveBeenCalledWith(expect.stringContaining('Falha na auditoria'));
    expect(mocks.warningToast).not.toHaveBeenCalled();
    expect(mocks.successToast).not.toHaveBeenCalled();
  });

  it.each([
    { motivo: 'resposta vazia', data: null },
    { motivo: 'sucesso negado', data: { success: false, primary_id: 'primario', secondary_id: 'secundario' } },
    { motivo: 'IDs de outra mesclagem', data: { success: true, primary_id: 'outro', secondary_id: 'secundario' } },
  ])('não confirma $motivo', async ({ data }) => {
    mocks.rpc.mockResolvedValueOnce({ data, error: null });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({ entity: 'contacts', primaryId: 'primario', secondaryId: 'secundario' }))
      .rejects.toThrow('Mesclagem não confirmada pelo banco');
    expect(mocks.from).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
    expect(mocks.successToast).not.toHaveBeenCalled();
  });

  it('confirma contatos quando o banco devolve os UUIDs na forma canônica', async () => {
    const primaryId = 'a0000000-0000-0000-0000-000000000001';
    const secondaryId = 'b0000000-0000-0000-0000-000000000002';
    mocks.rpc.mockResolvedValueOnce({ data: { success: true, primary_id: primaryId, secondary_id: secondaryId }, error: null });
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await expect(result.current.mutateAsync({
      entity: 'contacts', primaryId: primaryId.toUpperCase(), secondaryId: `{${secondaryId.replaceAll('-', '')}}`,
    })).resolves.toMatchObject({ primaryId: primaryId.toUpperCase() });
    expect(mocks.successToast).toHaveBeenCalled();
    expect(mocks.errorToast).not.toHaveBeenCalled();
  });

  it('confirma empresas quando o banco normaliza os UUIDs enviados', async () => {
    const primaryId = 'a0000000-0000-0000-0000-000000000001';
    const secondaryId = 'b0000000-0000-0000-0000-000000000002';
    mocks.rpc.mockResolvedValueOnce({ data: { success: true, primary_id: primaryId, secondary_id: secondaryId }, error: null });
    const { result } = renderHook(() => useMergeCompanies(), { wrapper });
    await expect(result.current.mutateAsync({ primaryId: `{${primaryId.toUpperCase()}}`, secondaryId: secondaryId.replaceAll('-', '') }))
      .resolves.toMatchObject({ success: true });
    expect(mocks.successToast).toHaveBeenCalled();
    expect(mocks.errorToast).not.toHaveBeenCalled();
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
