import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callExternalRpc, deleteExternalData, insertExternalData, queryExternalData, updateExternalData } from './externalData';

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
