import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callExternalRpc, queryExternalData } from './externalData';
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
  getCircuitBreaker('external-db:sales_activities', { failureThreshold: 3 }).reset();
  getCircuitBreaker('external-db:companies', { failureThreshold: 3 }).reset();
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical.supabase.co');
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-usuario' } } });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Isolamento dos circuitos canônico e externo', () => {
  it.each([400, 401, 403, 404, 409, 422, 429])('não abre o circuito de atividades por erro HTTP %i', async status => {
    mocks.fetch.mockResolvedValue({ ok: false, status, text: async () => 'Requisição recusada' });
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = await queryExternalData({ table: 'sales_activities', auditAccess: false });
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error).not.toBeInstanceOf(CircuitOpenError);
    }
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [], count: 0 }) });
    await expect(queryExternalData({ table: 'sales_activities', auditAccess: false }))
      .resolves.toEqual({ data: [], count: 0, error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(5);
  });

  it('abre o circuito de um recurso indisponível sem bloquear empresas', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 503, text: async () => 'Indisponível' });
    for (let attempt = 0; attempt < 3; attempt++) {
      expect((await queryExternalData({ table: 'sales_activities', auditAccess: false })).error)
        .not.toBeInstanceOf(CircuitOpenError);
    }
    expect((await queryExternalData({ table: 'sales_activities', auditAccess: false })).error)
      .toBeInstanceOf(CircuitOpenError);
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [{ id: 'empresa-confirmada' }], count: 1 }) });
    await expect(queryExternalData({ table: 'companies', auditAccess: false }))
      .resolves.toEqual({ data: [{ id: 'empresa-confirmada' }], count: 1, error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(4);
  });

  it.each([
    { data: [], count: 'inválido' },
    { data: null, count: 0 },
  ])('não abre circuito por resposta de contrato inválida', async response => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => response });
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = await queryExternalData({ table: 'sales_activities', auditAccess: false });
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error).not.toBeInstanceOf(CircuitOpenError);
    }
    expect(mocks.fetch).toHaveBeenCalledTimes(4);
  });

  it.each([400, 401, 403, 404, 409, 422, 429])('não bloqueia uma RPC válida depois de erros HTTP %i', async status => {
    mocks.fetch.mockResolvedValue({ ok: false, status, text: async () => 'Requisição recusada' });
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = await callExternalRpc('persist_rfm_analysis', { _rows: [] });
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error).not.toBeInstanceOf(CircuitOpenError);
    }
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => 1 });
    await expect(callExternalRpc<number>('persist_rfm_analysis', { _rows: [] }))
      .resolves.toEqual({ data: 1, error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(5);
  });

  it('não bloqueia o banco após tentativas sem sessão', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    for (let attempt = 0; attempt < 4; attempt++) {
      expect((await callExternalRpc('persist_rfm_analysis', { _rows: [] })).error)
        .toHaveProperty('message', 'Autenticação necessária para a RPC do banco');
    }
    expect(mocks.fetch).not.toHaveBeenCalled();
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-usuario' } } });
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => 1 });
    await expect(callExternalRpc<number>('persist_rfm_analysis', { _rows: [] }))
      .resolves.toEqual({ data: 1, error: null });
  });

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
