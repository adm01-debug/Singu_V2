import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureError, clearUserContext, useErrorReporter } from './errorReporting';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), fetch: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mocks.getSession } } }));
vi.mock('@/lib/logger', () => ({ logger: { group: vi.fn(), error: vi.fn(), groupEnd: vi.fn() } }));

beforeEach(() => {
  clearUserContext();
  vi.clearAllMocks();
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'chave-publica');
  mocks.fetch.mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', mocks.fetch);
});
afterEach(() => { clearUserContext(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function fillBuffer() {
  for (let i = 0; i < 10; i++) captureError(new Error(`E${i}`));
}

describe('Relatórios de erros autenticados', () => {
  it('envia o JWT e atribui os erros ao usuário da sessão', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-dono', user: { id: 'dono' } } } });
    fillBuffer();
    await vi.waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1));
    const [url, request] = mocks.fetch.mock.calls[0];
    expect(url).toBe('https://canonical.supabase.co/rest/v1/error_logs');
    expect(request.headers).toMatchObject({ apikey: 'chave-publica', Authorization: 'Bearer jwt-do-dono' });
    expect(JSON.parse(request.body)).toHaveLength(10);
    expect(JSON.parse(request.body)).toEqual(expect.arrayContaining([expect.objectContaining({ user_id: 'dono' })]));
  });

  it('não tenta gravar com a chave pública quando não há sessão', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    fillBuffer();
    await vi.waitFor(() => expect(mocks.getSession).toHaveBeenCalledTimes(1));
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('descarta erros identificados como pertencentes a outra conta', async () => {
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-do-dono', user: { id: 'dono' } } } });
    useErrorReporter().setUserContext('outro-usuario');
    fillBuffer();
    await vi.waitFor(() => expect(mocks.getSession).toHaveBeenCalledTimes(1));
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
