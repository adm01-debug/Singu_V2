import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useActivityLogger } from './useActivityLogger';

const mocks = vi.hoisted(() => ({ insert: vi.fn(), from: vi.fn(), user: { id: 'dono' } }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
});

describe('Eventos canônicos de auditoria', () => {
  it.each(['contact', 'company', 'interaction'] as const)('persiste eventos de %s aceitos pelo banco', async entityType => {
    const { result } = renderHook(() => useActivityLogger());
    for (const type of ['created', 'updated', 'deleted'] as const) {
      await act(async () => result.current.logActivity({ type, entityType, entityId: 'registro' }));
      expect(mocks.insert).toHaveBeenLastCalledWith(expect.objectContaining({
        user_id: 'dono', type: `${entityType}_${type}`, entity_type: entityType, entity_id: 'registro',
      }));
    }
  });

  it('não transforma uma falha de auditoria em falha da operação principal', async () => {
    mocks.insert.mockResolvedValue({ error: new Error('Auditoria indisponível') });
    const { result } = renderHook(() => useActivityLogger());
    await expect(result.current.logActivity({ type: 'deleted', entityType: 'contact', entityId: 'registro' }))
      .resolves.toBeUndefined();
  });
});
