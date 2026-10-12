import { afterEach, expect, it, vi } from 'vitest';
import { queryExternalData } from './externalData';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), from: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: vi.fn() }, from: mocks.from },
}));

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('lê atividades existentes sem gravar uma criação de interação na auditoria', async () => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical.supabase.co');
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-usuario', user: { id: 'dono' } } } });
  const activity = { id: 'atividade-do-vendedor', contact_name: 'Ana Lima' };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true, json: async () => ({ data: [activity], count: 1 }),
  }));

  expect(await queryExternalData({ table: 'sales_activities' }))
    .toEqual({ data: [activity], count: 1, error: null });
  expect(mocks.from).not.toHaveBeenCalled();
});
