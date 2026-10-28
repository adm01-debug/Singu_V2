import React, { type PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRestoreEntity } from '@/hooks/useRestoreEntity';

const state = vi.hoisted(() => ({ fetch: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: state.success, error: state.error } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: {
  onAuthStateChange: vi.fn(),
  getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
} } }));
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal('fetch', state.fetch);
  cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});
afterEach(() => { cleanup(); cache.clear(); vi.unstubAllGlobals(); });

describe('Desfazer usa o envelope do wrapper externo real, com transporte simulado', () => {
  it.each([null, { id: 'outro' }])('HTTP 200 com data=%j não confirma restauração', async data => {
    state.fetch.mockResolvedValue({ ok: true, json: async () => ({ data }) });
    const { result } = renderHook(useRestoreEntity, { wrapper });
    await act(async () => { expect(await result.current.restore('contacts', { id: 'contato-1' })).toBe(false); });
    expect(state.fetch).toHaveBeenCalledOnce();
    expect(state.success).not.toHaveBeenCalled();
    expect(state.error).toHaveBeenCalledOnce();
  });

  it('HTTP 200 com registro correspondente mantém o sucesso', async () => {
    state.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'contato-1' } }) });
    const { result } = renderHook(useRestoreEntity, { wrapper });
    await act(async () => { expect(await result.current.restore('contacts', { id: 'contato-1' })).toBe(true); });
    expect(state.fetch).toHaveBeenCalledOnce();
    expect(state.success).toHaveBeenCalledOnce();
    expect(state.error).not.toHaveBeenCalled();
  });
});
