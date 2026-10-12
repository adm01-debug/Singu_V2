import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callExternalRpc } from './externalData';
import { CircuitOpenError, getCircuitBreaker } from './circuitBreaker';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), getSession: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: vi.fn() } },
}));

beforeEach(() => {
  vi.resetAllMocks();
  getCircuitBreaker('external-db').reset();
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical.supabase.co');
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-usuario' } } });
});

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Erros de RPC no envelope HTTP 200', () => {
  it.each(['42501', '42883', '22P02', '23505', 'PGRST202', 'P0001'])(
    'não bloqueia outra RPC após três recusas de contrato (%s)', async errorCode => {
      mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: null, error: 'RPC recusada', errorCode }) });
      for (let attempt = 0; attempt < 4; attempt++) {
        const result = await callExternalRpc('get_pipeline_summary');
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error).not.toBeInstanceOf(CircuitOpenError);
      }
      mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: ['ok'] }) });
      expect(await callExternalRpc('get_complete_dashboard')).toEqual({ data: ['ok'], error: null });
      expect(mocks.fetch).toHaveBeenCalledTimes(5);
    },
  );

  it('contabiliza indisponibilidade do banco e interrompe a quarta tentativa', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: null, error: 'Falha no banco', errorCode: '08006' }) });
    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await callExternalRpc('get_pipeline_summary')).error).not.toBeInstanceOf(CircuitOpenError);
    }
    expect((await callExternalRpc('get_pipeline_summary')).error).toBeInstanceOf(CircuitOpenError);
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
  });
});
