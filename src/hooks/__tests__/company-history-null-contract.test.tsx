import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useUnifiedCommunicationHistory } from '../useInteractionsRpc';

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'usuario-1' } }) }));
vi.mock('@/lib/externalData', () => ({ callExternalRpc: mocks.rpc }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

describe('Nulabilidade do histórico unificado de empresa', () => {
  it('preserva todas as interações legadas com fallback de tipo e canal', async () => {
    mocks.rpc.mockResolvedValue({ data: [
      { interaction_type: null, channel: 'email' },
      { interaction_type: 'meeting', channel: null },
      { interaction_type: null, channel: null },
    ].map((item, index) => ({ ...item, interaction_id: `interacao-${index}`, summary: null, interaction_date: '2026-10-11T12:00:00Z', user_name: 'Usuário' })), error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    const { result } = renderHook(() => useUnifiedCommunicationHistory('empresa-1', 50, 'company'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map(row => [row.id, row.type, row.channel])).toEqual([
      ['interacao-0', 'email', 'email'], ['interacao-1', 'meeting', 'meeting'], ['interacao-2', 'note', 'note'],
    ]);
  });
});
