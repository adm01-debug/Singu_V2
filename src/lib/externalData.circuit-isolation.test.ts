import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callExternalRpc } from './externalData';
import { CircuitOpenError, getCircuitBreaker } from './circuitBreaker';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), getSession: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { onAuthStateChange: vi.fn(), getSession: mocks.getSession },
} }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
  getCircuitBreaker('external-db').reset();
  getCircuitBreaker('canonical-db').reset();
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical.supabase.co');
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-usuario' } } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Isolamento dos circuitos canônico e externo', () => {
  it('continua persistindo RFM quando o proxy externo está indisponível', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 503, text: async () => 'Indisponível' });
    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await callExternalRpc('get_pipeline_summary')).error).toBeInstanceOf(Error);
    }
    const blocked = await callExternalRpc('get_pipeline_summary');
    expect(blocked.error).toBeInstanceOf(CircuitOpenError);
    expect(mocks.fetch).toHaveBeenCalledTimes(3);

    mocks.fetch.mockResolvedValue({ ok: true, json: async () => 1 });
    await expect(callExternalRpc<number>('persist_rfm_analysis', { _rows: [] }))
      .resolves.toEqual({ data: 1, error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(4);
    expect(mocks.fetch.mock.calls[3][0]).toContain('/rest/v1/rpc/persist_rfm_analysis');
  });

  it('mantém as consultas externas quando a persistência RFM está indisponível', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 503, text: async () => 'Indisponível' });
    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await callExternalRpc('persist_rfm_analysis', { _rows: [] })).error).toBeInstanceOf(Error);
    }
    const blocked = await callExternalRpc('persist_rfm_analysis', { _rows: [] });
    expect(blocked.error).toBeInstanceOf(CircuitOpenError);
    expect(mocks.fetch).toHaveBeenCalledTimes(3);

    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    await expect(callExternalRpc('get_pipeline_summary')).resolves.toEqual({ data: [], error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(4);
    expect(mocks.fetch.mock.calls[3][0]).toContain('/functions/v1/external-data');
  });
});
