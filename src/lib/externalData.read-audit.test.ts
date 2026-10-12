import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryExternalData } from './externalData';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), from: vi.fn(), insert: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: mocks.getSession, onAuthStateChange: vi.fn() }, from: mocks.from,
} }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt', user: { id: 'dono' } } } });
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ id: 'registro' }], count: 1 }) }));
});
afterEach(() => vi.unstubAllGlobals());

describe('Auditoria de leitura', () => {
  it.each(['contacts', 'vw_singu_contact_360'])('classifica leitura de %s como visualização de contato', async table => {
    expect((await queryExternalData({ table })).error).toBeNull();
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ type: 'contact_viewed', entity_type: 'contact', user_id: 'dono' }));
  });

  it.each(['sales_activities', 'proposals', 'tasks'])('não inventa criação de interação ao ler %s', async table => {
    expect((await queryExternalData({ table })).error).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('registra o ID filtrado mesmo quando a seleção não retorna esse campo', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ first_name: 'QA' }], count: 1 }) }));
    expect((await queryExternalData({ table: 'contacts', select: 'first_name', filters: [{ type: 'eq', column: 'id', value: id }] })).error).toBeNull();
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ type: 'contact_viewed', entity_id: id }));
  });

  it('registra a lista sem inventar ID e informa quantos registros foram vistos', async () => {
    expect((await queryExternalData({ table: 'companies' })).error).toBeNull();
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      type: 'company_viewed', entity_id: null, metadata: expect.objectContaining({ record_count: 1 }),
    }));
  });

  it('identifica o contato acessado pela visão 360 mesmo sem o ID na seleção', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ first_name: 'QA' }], count: 1 }) }));
    expect((await queryExternalData({ table: 'vw_singu_contact_360', select: 'first_name', filters: [{ type: 'eq', column: 'contact_id', value: id }] })).error).toBeNull();
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ type: 'contact_viewed', entity_id: id }));
  });

  it('mantém os dados lidos mesmo que a auditoria lance uma exceção', async () => {
    mocks.insert.mockRejectedValue(new Error('Auditoria indisponível'));
    expect(await queryExternalData({ table: 'contacts' })).toEqual({ data: [{ id: 'registro' }], count: 1, error: null });
  });

  it('não atribui a consulta a uma sessão diferente', async () => {
    mocks.getSession.mockResolvedValueOnce({ data: { session: { access_token: 'jwt-dono', user: { id: 'dono' } } } })
      .mockResolvedValue({ data: { session: { access_token: 'jwt-outro', user: { id: 'outro' } } } });
    expect((await queryExternalData({ table: 'contacts' })).error).toBeNull();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('mantém a auditoria da consulta após renovação do token da mesma conta', async () => {
    mocks.getSession.mockResolvedValueOnce({ data: { session: { access_token: 'jwt-antigo', user: { id: 'dono' } } } })
      .mockResolvedValue({ data: { session: { access_token: 'jwt-renovado', user: { id: 'dono' } } } });
    expect((await queryExternalData({ table: 'contacts' })).error).toBeNull();
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'dono' }));
  });

  it('retorna os dados no limite de espera sem repetir a auditoria', async () => {
    vi.useFakeTimers();
    mocks.insert.mockReturnValue(new Promise(() => {}));
    try {
      const read = queryExternalData({ table: 'contacts' });
      await vi.advanceTimersByTimeAsync(5000);
      expect((await read).data).toEqual([{ id: 'registro' }]);
      expect(mocks.insert).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
