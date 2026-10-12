import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureError, clearUserContext, initGlobalErrorHandlers } from './errorReporting';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(), fetch: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange } } }));
vi.mock('@/lib/logger', () => ({ logger: { group: vi.fn(), error: vi.fn(), groupEnd: vi.fn() } }));

beforeEach(() => {
  clearUserContext();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_SUPABASE_URL', 'https://canonical.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'publica');
  mocks.fetch.mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', mocks.fetch);
  vi.spyOn(window, 'addEventListener').mockImplementation(() => undefined);
  vi.spyOn(document, 'addEventListener').mockImplementation(() => undefined);
  initGlobalErrorHandlers();
});
afterEach(() => { clearUserContext(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function unload() {
  const listener = vi.mocked(window.addEventListener).mock.calls.find(([name]) => name === 'beforeunload')?.[1];
  if (typeof listener !== 'function') throw new Error('Handler de fechamento ausente');
  listener(new Event('beforeunload'));
}

describe('Envio final autenticado de erros', () => {
  it('inicia o envio em segundo plano sem consultar a sessão nem repetir no fechamento', () => {
    mocks.onAuthStateChange.mock.calls[0][0]('SIGNED_IN', {
      access_token: 'jwt-mobile', expires_at: Date.now() / 1000 + 600, user: { id: 'dono' },
    });
    captureError(new Error('Erro antes de ocultar'));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const listener = vi.mocked(document.addEventListener).mock.calls.find(([name]) => name === 'visibilitychange')?.[1];
    if (typeof listener !== 'function') throw new Error('Handler de visibilidade ausente');
    listener(new Event('visibilitychange'));
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0][1]).toMatchObject({ keepalive: true, headers: { Authorization: 'Bearer jwt-mobile' } });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)[0].user_id).toBe('dono');
    unload();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it('descarta erros anteriores ao login sem descartar os capturados após autenticar', () => {
    const notify = mocks.onAuthStateChange.mock.calls[0][0];
    notify('INITIAL_SESSION', null);
    captureError(new Error('Erro antes do login'));
    notify('SIGNED_IN', { access_token: 'jwt-a', user: { id: 'a' } });
    captureError(new Error('Erro após o login'));
    unload();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toEqual([
      expect.objectContaining({ message: 'Erro após o login', user_id: 'a' }),
    ]);
  });

  it('descarta lote anônimo se o login acontece durante a consulta da sessão', async () => {
    const notify = mocks.onAuthStateChange.mock.calls[0][0];
    notify('INITIAL_SESSION', null);
    mocks.getSession.mockImplementation(async () => {
      const session = { access_token: 'jwt-a', user: { id: 'a' } };
      notify('SIGNED_IN', session);
      return { data: { session } };
    });
    for (let index = 0; index < 10; index++) captureError(new Error(`Anônimo ${index}`));
    await Promise.resolve();
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('inicia fetch keepalive sincronamente com o token renovado, sem getSession', () => {
    const notify = mocks.onAuthStateChange.mock.calls[0][0];
    const session = { access_token: 'jwt-antigo', expires_at: Date.now() / 1000 + 600, user: { id: 'dono' } };
    notify('SIGNED_IN', session);
    captureError(new Error('Erro final'));
    notify('TOKEN_REFRESHED', { ...session, access_token: 'jwt-renovado' });
    unload();
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0][1]).toMatchObject({ keepalive: true, headers: { Authorization: 'Bearer jwt-renovado' } });
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)[0].user_id).toBe('dono');
  });

  it('descarta erros da conta anterior na troca de usuário', () => {
    const notify = mocks.onAuthStateChange.mock.calls[0][0];
    notify('SIGNED_IN', { access_token: 'jwt-a', user: { id: 'a' } });
    captureError(new Error('Erro de A'));
    notify('SIGNED_IN', { access_token: 'jwt-b', user: { id: 'b' } });
    unload();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each([null, { access_token: 'expirado', expires_at: 1, user: { id: 'dono' } }])('não envia com sessão ausente ou expirada: %j', session => {
    mocks.onAuthStateChange.mock.calls[0][0]('INITIAL_SESSION', session);
    captureError(new Error('Erro final'));
    unload();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.getSession).not.toHaveBeenCalled();
  });
});
