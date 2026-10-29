import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callExternalRpc, ConcurrentEditError, deleteExternalData, insertExternalData, queryExternalData, updateExternalData, updateExternalDataWithVersion } from './externalData';

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), from: vi.fn(), getSession: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { onAuthStateChange: vi.fn(), getSession: mocks.getSession }, from: mocks.from,
} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/circuitBreaker', () => ({
  getCircuitBreaker: () => ({ call: (operation: () => Promise<unknown>) => operation() }),
  CircuitOpenError: class extends Error {},
}));

function respond(payload: unknown) {
  mocks.fetch.mockResolvedValue({ ok: true, json: async () => payload });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  mocks.from.mockImplementation(() => { throw new Error('Nenhuma gravação real permitida'); });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe('escrita versionada distingue conflito de versão de transação abortada', () => {
  const id = '44444444-4444-4444-8444-444444444444';

  it.each(['40P01', '40001', '55P03'])('permite nova tentativa com a mesma versão após %s', async sqlState => {
    mocks.fetch.mockResolvedValueOnce({ ok: false, status: 409, text: async () => JSON.stringify({
      error: 'WRITE_CONFLICT', message: 'Write conflict; retry the transaction', retryable: true, sqlState,
    }) });
    const result = await updateExternalDataWithVersion('contacts', id, 3, { notes: 'edição' });
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error).not.toBeInstanceOf(ConcurrentEditError);
    expect(result.error?.message).toContain('WRITE_CONFLICT');
    respond({ data: { id, version: 4 } });
    await expect(updateExternalDataWithVersion('contacts', id, 3, { notes: 'edição' }))
      .resolves.toEqual({ data: { id, version: 4 }, error: null });
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    for (const [, options] of mocks.fetch.mock.calls) {
      expect(JSON.parse(options.body)).toMatchObject({ action: 'update_with_version', id, version: 3 });
    }
  });

  it('preserva metadados do CONCURRENT_EDIT estruturado', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 409, text: async () => JSON.stringify({
      error: 'CONCURRENT_EDIT', entity: 'contacts', id, attemptedVersion: 3, traceId: 'rastro-local',
    }) });
    const { error } = await updateExternalDataWithVersion('contacts', id, 3, { notes: 'edição' });
    expect(error).toBeInstanceOf(ConcurrentEditError);
    expect(error).toMatchObject({ table: 'contacts', id, attemptedVersion: 3, traceId: 'rastro-local' });
  });

  it('preserva o marcador legado sem JSON', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 409, text: async () => 'CONCURRENT_EDIT entity=contacts' });
    const { error } = await updateExternalDataWithVersion('contacts', id, 3, { notes: 'edição' });
    expect(error).toBeInstanceOf(ConcurrentEditError);
    expect(error).toMatchObject({ table: 'contacts', id });
  });

  it.each(['Conflito desconhecido', JSON.stringify({ error: 'WRITE_CONFLICT', message: 'CONCURRENT_EDIT não se aplica' })])('não deduz versão obsoleta de HTTP 409 genérico: %s', async payload => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 409, text: async () => payload });
    const { error } = await updateExternalDataWithVersion('contacts', id, 3, { notes: 'edição' });
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ConcurrentEditError);
  });
});

describe('external-data não mascara falhas como carteira vazia', () => {
  it.each([
    { fallback: true, error: 'Fonte indisponível', data: [], count: 0 },
    { fallback: true, data: [], count: 0 },
    { error: 'Falha upstream' },
    null,
    [],
    { data: null, count: 0 },
    { data: {}, count: 0 },
    { count: 0 },
    { data: [] },
    { data: [], count: '0' },
    { data: [], count: -1 },
    { data: [], count: 1.5 },
  ])('propaga envelope inválido/degradado: %j', async payload => {
    respond(payload);
    const result = await queryExternalData<unknown>({ table: 'contacts' });
    expect(result.data).toBeNull();
    expect(result.count).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('preserva lista legitimamente vazia e contagem zero', async () => {
    respond({ data: [], count: 0 });
    await expect(queryExternalData<unknown>({ table: 'contacts' })).resolves.toEqual({ data: [], count: 0, error: null });
  });

  it('preserva contagem desconhecida como null, não zero', async () => {
    respond({ data: [{ id: 'contato-1' }], count: null });
    await expect(queryExternalData<unknown>({ table: 'contacts' })).resolves.toEqual({ data: [{ id: 'contato-1' }], count: null, error: null });
  });

  it('propaga JSON ilegível', async () => {
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError('JSON inválido'); } });
    const result = await queryExternalData<unknown>({ table: 'companies' });
    expect(result.error).toBeInstanceOf(SyntaxError);
    expect(result.data).toBeNull();
  });

  it('preserva erro HTTP em vez de retornar dados vazios', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 503, text: async () => 'Indisponível' });
    const result = await queryExternalData<unknown>({ table: 'companies' });
    expect(result.error?.message).toContain('[503]');
    expect(result.data).toBeNull();
  });

  it('preserva cancelamento para o consumidor', async () => {
    const failure = new DOMException('Cancelado', 'AbortError');
    mocks.fetch.mockRejectedValue(failure);
    const result = await queryExternalData<unknown>({ table: 'contacts', signal: new AbortController().signal });
    expect(result.error).toBe(failure);
    expect(result.data).toBeNull();
  });

  it('propaga fallback nas operações de escrita e RPC, sem falso sucesso', async () => {
    respond({ fallback: true, error: 'Fonte indisponível', data: null });
    const results = await Promise.all([
      insertExternalData<unknown>('contacts', { first_name: 'Teste' }),
      updateExternalData<unknown>('contacts', 'contato-1', { first_name: 'Teste' }),
      deleteExternalData('contacts', 'contato-1'),
      callExternalRpc<unknown>('rpc-teste'),
    ]);
    for (const result of results) expect(result.error?.message).toBe('Fonte indisponível');
    expect(results[2]).toMatchObject({ success: false });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
