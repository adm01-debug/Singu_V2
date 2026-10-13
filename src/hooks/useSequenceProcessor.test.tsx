import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { useSequenceProcessor } from './useSequenceProcessor';

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), error: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: vi.fn() } }));

beforeEach(() => {
  mocks.invoke.mockReset();
  mocks.error.mockReset();
});

it('não repete a mutação do processador após falha', async () => {
  mocks.invoke.mockResolvedValue({ data: null, error: new Error('Falha no processador') });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: 1, retryDelay: 0 } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useSequenceProcessor(), { wrapper });

  await act(async () => {
    await expect(result.current.mutateAsync()).rejects.toThrow('Falha no processador');
  });

  expect(mocks.invoke).toHaveBeenCalledTimes(1);
});
