import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMergeRecords } from '../useMergeRecords';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario' } }) }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: mocks.rpc }));

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
beforeEach(() => {
  vi.clearAllMocks();
  client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  mocks.rpc.mockResolvedValue({ data: { success: true, primary_id: 'primario', secondary_id: 'secundario' }, error: null });
});

describe('DB-01: nome obrigatório no override de empresa', () => {
  it.each([null, '', '   ', '\t\n\r\f\v', '\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff', 17, true, [], {}])(
    'rejeita %j antes da RPC', async (nome_crm) => {
      const { result } = renderHook(() => useMergeRecords(), { wrapper });
      await expect(result.current.mutateAsync({
        entity: 'companies', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides: { nome_crm },
      })).rejects.toMatchObject({ name: 'ZodError' });
      expect(mocks.rpc).not.toHaveBeenCalled();
      expect(mocks.success).not.toHaveBeenCalled();
    },
  );

  it.each([
    { nome_crm: '  Nome válido  ', notes: null, website: null },
    { notes: null, website: null },
    {},
  ])('preserva o payload válido %j sem normalização', async (fieldOverrides) => {
    const { result } = renderHook(() => useMergeRecords(), { wrapper });
    await result.current.mutateAsync({
      entity: 'companies', primaryId: 'primario', secondaryId: 'secundario', fieldOverrides,
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('merge_records_atomically', {
      p_entity: 'companies', p_primary_id: 'primario', p_secondary_id: 'secundario', p_field_overrides: fieldOverrides,
    });
  });
});
