import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callExternalRpc } from './externalData';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), getSession: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { onAuthStateChange: vi.fn(), getSession: mocks.getSession },
} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/circuitBreaker', () => ({
  getCircuitBreaker: () => ({ call: (operation: () => Promise<unknown>) => operation() }),
  CircuitOpenError: class extends Error {},
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical.supabase.co');
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-usuario' } } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('RPC RFM no banco canônico', () => {
  it('envia um lote maior que 128 KiB em uma única chamada autenticada ao banco', async () => {
    const rows = Array.from({ length: 200 }, (_, index) => ({ contact_id: `contato-${index}`, segment_description: 'x'.repeat(2000) }));
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => 200 });
    await expect(callExternalRpc<number>('persist_rfm_analysis', { _rows: rows })).resolves.toEqual({ data: 200, error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch).toHaveBeenCalledWith('https://canonical.supabase.co/rest/v1/rpc/persist_rfm_analysis', expect.objectContaining({
      method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer jwt-do-usuario' }),
      body: JSON.stringify({ _rows: rows }),
    }));
    expect(new TextEncoder().encode(mocks.fetch.mock.calls[0][1].body).length).toBeGreaterThan(128 * 1024);
  });

  it('propaga a recusa do banco sem confirmar persistência', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 403, text: async () => 'Sem permissão' });
    const result = await callExternalRpc<number>('persist_rfm_analysis', { _rows: [] });
    expect(result.data).toBeNull();
    expect(result.error?.message).toContain('RPC do banco [403]');
  });

  it('não envia a chave pública como autenticação de usuário', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    const result = await callExternalRpc<number>('persist_rfm_analysis', { _rows: [] });
    expect(result.error?.message).toContain('Autenticação necessária');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('mantém as demais RPCs no proxy externo', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    await expect(callExternalRpc('get_deals_pipeline', { p_user_id: 'dono' })).resolves.toEqual({ data: [], error: null });
    expect(mocks.fetch.mock.calls[0][0]).toContain('/functions/v1/external-data');
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual({ action: 'rpc', functionName: 'get_deals_pipeline', params: { p_user_id: 'dono' } });
  });
});
