// A-007: um único service worker (VitePWA) deve dono do escopo "/", com os handlers de push importados nele.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const root = resolve(__dirname, '../..');

describe('A-007: service worker de push unificado', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

  it('vite.config importa sw-push.js no SW gerado (sem precache duplicado)', () => {
    const cfg = readFileSync(resolve(root, 'vite.config.ts'), 'utf8');
    expect(cfg).toMatch(/importScripts:\s*\[\s*"sw-push\.js"\s*\]/);
    expect(cfg).toMatch(/globIgnores:\s*\[\s*"sw-push\.js"\s*\]/);
    expect(cfg).toMatch(/registerType:\s*"autoUpdate"/);
  });

  it('main.tsx nunca cancela inscrição nem desregistra service worker', () => {
    const main = readFileSync(resolve(root, 'src/main.tsx'), 'utf8');
    expect(main).not.toMatch(/\.unsubscribe\(/);
    expect(main).not.toMatch(/\.unregister\(/);
    expect(main).not.toMatch(/getRegistrations\(/);
  });

  it('em produção usa serviceWorker.ready e NÃO registra /sw-push.js', async () => {
    vi.stubEnv('PROD', true);
    const reg = { scope: '/' } as ServiceWorkerRegistration;
    const register = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(reg), register } });
    const { registerServiceWorker } = await import('./pushNotifications');
    expect(await registerServiceWorker()).toBe(reg);
    expect(register).not.toHaveBeenCalled();
  });

  it('em produção, se o SW nunca ficar pronto, devolve null (não trava)', async () => {
    vi.useFakeTimers();
    vi.stubEnv('PROD', true);
    vi.stubGlobal('navigator', { serviceWorker: { ready: new Promise(() => {}), register: vi.fn() } });
    const { registerServiceWorker } = await import('./pushNotifications');
    const p = registerServiceWorker();
    await vi.advanceTimersByTimeAsync(10_001);
    expect(await p).toBeNull();
    vi.useRealTimers();
  });

  it('em dev registra /sw-push.js direto', async () => {
    vi.stubEnv('PROD', false);
    const reg = { scope: '/' } as ServiceWorkerRegistration;
    const register = vi.fn().mockResolvedValue(reg);
    vi.stubGlobal('navigator', { serviceWorker: { ready: new Promise(() => {}), register } });
    const { registerServiceWorker } = await import('./pushNotifications');
    expect(await registerServiceWorker()).toBe(reg);
    expect(register).toHaveBeenCalledWith('/sw-push.js', { scope: '/' });
  });
});
