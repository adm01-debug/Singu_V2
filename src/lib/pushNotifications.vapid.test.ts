// Chave VAPID própria + migração de assinaturas feitas com a chave de exemplo da biblioteca web-push.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const upsert = vi.fn().mockResolvedValue({ error: null });
const del = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) },
    from: vi.fn(() => ({ upsert, delete: () => ({ eq: () => ({ eq: (...a: unknown[]) => { del(...a); return Promise.resolve({ error: null }); } }) }) })),
  },
}));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const EXEMPLO = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const root = resolve(__dirname, '../..');
const b64u = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/={1,2}$/, '');
const toBytes = (k: string) => Uint8Array.from(atob(k.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (k.length % 4)) % 4)), (c) => c.charCodeAt(0));

function pushEnv(opts: { existingKey?: string | null; permission?: string }) {
  const unsubscribe = vi.fn().mockResolvedValue(true);
  const existing = opts.existingKey === undefined ? null : {
    endpoint: 'https://fcm.googleapis.com/old', unsubscribe,
    options: { applicationServerKey: opts.existingKey === null ? null : toBytes(opts.existingKey).buffer },
  };
  const fresh = { endpoint: 'https://fcm.googleapis.com/new', toJSON: () => ({ keys: { p256dh: 'p', auth: 'a' } }) };
  const subscribe = vi.fn().mockResolvedValue(fresh);
  const reg = { pushManager: { getSubscription: vi.fn().mockResolvedValue(existing), subscribe } };
  vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(reg), register: vi.fn(), addEventListener: vi.fn() } });
  vi.stubGlobal('window', { PushManager: class {} });
  vi.stubGlobal('Notification', { permission: opts.permission ?? 'granted' });
  vi.stubEnv('PROD', true);
  return { unsubscribe, subscribe };
}

describe('VAPID próprio', () => {
  beforeEach(() => { upsert.mockClear(); del.mockClear(); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

  it('o código não carrega mais a chave de exemplo da web-push', () => {
    expect(readFileSync(resolve(root, 'src/lib/pushNotifications.ts'), 'utf8')).not.toContain(EXEMPLO);
  });

  it('assinatura feita com a chave de exemplo: cancela, reassina com a chave atual, grava a nova e SÓ então apaga a velha', async () => {
    const { unsubscribe, subscribe } = pushEnv({ existingKey: EXEMPLO });
    const { subscribeToPush } = await import('./pushNotifications');
    const sub = await subscribeToPush();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(1);
    const key = new Uint8Array((subscribe.mock.calls[0][0] as { applicationServerKey: ArrayBuffer }).applicationServerKey);
    expect(b64u(key)).not.toBe(EXEMPLO);
    expect(key.length).toBe(65);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'https://fcm.googleapis.com/new' }), expect.anything());
    expect(del).toHaveBeenCalledWith('endpoint', 'https://fcm.googleapis.com/old');
    expect(upsert.mock.invocationCallOrder[0]).toBeLessThan(del.mock.invocationCallOrder[0]);
    expect(sub).not.toBeNull();
  });

  it('assinatura já com a chave atual não é tocada; navegador que não informa a chave também não', async () => {
    const mod0 = await import('./pushNotifications');
    // descobre a chave atual reassinando uma vez sem assinatura prévia
    const e0 = pushEnv({});
    await mod0.subscribeToPush();
    const cur = b64u(new Uint8Array((e0.subscribe.mock.calls[0][0] as { applicationServerKey: ArrayBuffer }).applicationServerKey));
    vi.resetModules();
    const e1 = pushEnv({ existingKey: cur });
    const mod1 = await import('./pushNotifications');
    expect(await mod1.ensureCurrentPushSubscription()).toBe(false);
    expect(e1.unsubscribe).not.toHaveBeenCalled();
    vi.resetModules();
    const e2 = pushEnv({ existingKey: null });
    const mod2 = await import('./pushNotifications');
    expect(await mod2.ensureCurrentPushSubscription()).toBe(false);
    expect(e2.unsubscribe).not.toHaveBeenCalled();
  });

  it('ensureCurrentPushSubscription migra quem tem permissão e chave antiga; sem permissão não faz nada (sem prompt)', async () => {
    const e = pushEnv({ existingKey: EXEMPLO, permission: 'granted' });
    const mod = await import('./pushNotifications');
    expect(await mod.ensureCurrentPushSubscription()).toBe(true);
    expect(e.unsubscribe).toHaveBeenCalled();
    vi.resetModules();
    const n = pushEnv({ existingKey: EXEMPLO, permission: 'default' });
    const mod2 = await import('./pushNotifications');
    expect(await mod2.ensureCurrentPushSubscription()).toBe(false);
    expect(n.unsubscribe).not.toHaveBeenCalled();
    expect(n.subscribe).not.toHaveBeenCalled();
  });
});
