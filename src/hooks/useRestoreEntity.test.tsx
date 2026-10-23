import type { PropsWithChildren } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { insertExternalData } from '@/lib/externalData';
import { toast } from 'sonner';
import { useRestoreEntity } from './useRestoreEntity';

vi.mock('@/lib/externalData', () => ({ insertExternalData: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
let cache: QueryClient;
const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
beforeEach(() => {
  vi.clearAllMocks();
  cache = new QueryClient();
  vi.mocked(insertExternalData).mockImplementation(async (_table, payload) => ({
    data: null, error: 'full_name' in payload ? new Error('428C9: generated always') : null,
  }));
});
afterEach(() => { cleanup(); cache.clear(); });

describe('restauração do snapshot de um contato', () => {
  it('preserva a identidade sem reenviar nome gerado nem alterar o snapshot original', async () => {
    const snapshot = { id: 'contato-1', user_id: 'usuario-1', first_name: 'Ana', last_name: 'Silva', full_name: 'Ana Silva', version: 3 };
    const { result } = renderHook(() => useRestoreEntity(), { wrapper });
    await act(async () => { expect(await result.current.restore('contacts', snapshot)).toBe(true); });
    expect(insertExternalData).toHaveBeenCalledWith('contacts', {
      id: snapshot.id, user_id: snapshot.user_id, first_name: 'Ana', last_name: 'Silva', version: 3,
    });
    expect(snapshot.full_name).toBe('Ana Silva');
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });
});
