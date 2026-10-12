import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteExternalData } from './externalData';
import { getCircuitBreaker } from './circuitBreaker';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), from: vi.fn(), insert: vi.fn(), fetch: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: mocks.getSession, onAuthStateChange: vi.fn() }, from: mocks.from,
} }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
  getCircuitBreaker('external-db').reset();
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt', user: { id: 'dono' } } } });
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: null }) });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe('Auditoria única após exclusão confirmada', () => {
  it.each([['contacts', 'contact'], ['companies', 'company']])('grava somente um evento para %s com contexto do dono', async (table, entity) => {
    expect(await deleteExternalData(table, 'registro', { entityName: 'Nome', description: 'Excluído' })).toEqual({ success: true, error: null });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ type: `${entity}_deleted`, entity_type: entity, entity_id: 'registro', entity_name: 'Nome', description: 'Excluído', user_id: 'dono' }));
  });

  it('preserva o sucesso se a auditoria lançar uma exceção', async () => {
    mocks.insert.mockRejectedValue(new Error('Auditoria indisponível'));
    expect(await deleteExternalData('contacts', 'registro')).toEqual({ success: true, error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it('não registra exclusão se a mutação falhar', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 403, text: async () => 'Sem permissão' });
    expect((await deleteExternalData('contacts', 'registro')).success).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('confirma a exclusão após o limite de espera e não repete a auditoria atrasada', async () => {
    vi.useFakeTimers();
    let finishAudit: (value: { error: null }) => void = () => {};
    mocks.insert.mockReturnValue(new Promise<{ error: null }>(resolve => { finishAudit = resolve; }));
    try {
      const deletion = deleteExternalData('contacts', 'registro');
      await vi.advanceTimersByTimeAsync(4999);
      let completed = false;
      void deletion.then(() => { completed = true; });
      await Promise.resolve();
      expect(completed).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await deletion).toEqual({ success: true, error: null });
      finishAudit({ error: null });
      await Promise.resolve();
      expect(mocks.insert).toHaveBeenCalledTimes(1);
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('não inventa uma interação excluída para outras tabelas', async () => {
    expect((await deleteExternalData('tasks', 'registro')).success).toBe(true);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
