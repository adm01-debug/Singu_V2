import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryExternalData } from './externalData';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), from: vi.fn(), insert: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: mocks.getSession, onAuthStateChange: vi.fn() }, from: mocks.from,
} }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
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
});
