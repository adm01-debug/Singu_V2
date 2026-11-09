/* eslint-disable sonarjs/no-clear-text-protocols -- as URLs http/ftp são casos NEGATIVOS da allowlist de endpoint */
// Lógica pura do sender de push (supabase/functions/_shared/push.ts).
import { describe, it, expect, vi } from 'vitest';
import { isAllowedPushEndpoint, readVapidConfig, deliver, buildPayload } from '../../supabase/functions/_shared/push';

const PUB = 'B'.repeat(87);
const PRIV = 'a'.repeat(43);
const env = (o: Record<string, string>) => (k: string) => o[k];
const vapid = { publicKey: PUB, privateKey: PRIV, subject: 'https://x.supabase.co' };
const sub = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'p', auth: 'a' };
const wpThrows = (statusCode?: number) => ({ sendNotification: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { statusCode })) });

describe('allowlist de endpoint (anti-SSRF)', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/abc', 'https://updates.push.services.mozilla.com/wpush/v2/x',
    'https://web.push.apple.com/Q', 'https://wns2-par02p.notify.windows.com/w/?token=1',
  ])('aceita %s', (u) => expect(isAllowedPushEndpoint(u)).toBe(true));
  it.each([
    'http://fcm.googleapis.com/x', 'https://localhost/x', 'https://127.0.0.1/x', 'https://169.254.169.254/latest/meta-data',
    'https://evil.com/fcm.googleapis.com', 'https://fcm.googleapis.com.evil.com/x', 'https://user:pw@fcm.googleapis.com/x',
    'https://fcm.googleapis.com:8443/x', 'ftp://fcm.googleapis.com/x', 'não é url', '',
  ])('bloqueia %s', (u) => expect(isAllowedPushEndpoint(u)).toBe(false));
});

describe('readVapidConfig', () => {
  it('lê o par e usa a URL do projeto como subject quando não há VAPID_SUBJECT', () => {
    expect(readVapidConfig(env({ VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV, SUPABASE_URL: 'https://p.supabase.co' })))
      .toEqual({ publicKey: PUB, privateKey: PRIV, subject: 'https://p.supabase.co' });
  });
  it('VAPID_SUBJECT mailto: tem prioridade', () => {
    expect(readVapidConfig(env({ VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV, VAPID_SUBJECT: 'mailto:a@b.co', SUPABASE_URL: 'https://p.supabase.co' }))?.subject).toBe('mailto:a@b.co');
  });
  it.each([
    ['sem segredos', {}], ['só a pública', { VAPID_PUBLIC_KEY: PUB, SUPABASE_URL: 'https://p.co' }],
    ['pública curta', { VAPID_PUBLIC_KEY: 'abc', VAPID_PRIVATE_KEY: PRIV, SUPABASE_URL: 'https://p.co' }],
    ['privada com lixo', { VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV.slice(1) + '=', SUPABASE_URL: 'https://p.co' }],
    ['subject inválido', { VAPID_PUBLIC_KEY: PUB, VAPID_PRIVATE_KEY: PRIV, VAPID_SUBJECT: 'ftp://x' }],
  ])('devolve null: %s', (_n, o) => expect(readVapidConfig(env(o as Record<string, string>))).toBeNull());
});

describe('deliver', () => {
  it('sent: envia com TTL, urgency e vapidDetails', async () => {
    const wp = { sendNotification: vi.fn().mockResolvedValue({}) };
    expect(await deliver(wp, sub, '{}', vapid)).toEqual({ outcome: 'sent' });
    expect(wp.sendNotification).toHaveBeenCalledWith({ endpoint: sub.endpoint, keys: { p256dh: 'p', auth: 'a' } }, '{}',
      expect.objectContaining({ TTL: 86400, vapidDetails: { subject: vapid.subject, publicKey: PUB, privateKey: PRIV } }));
  });
  it('blocked: endpoint fora da allowlist NÃO chama o serviço', async () => {
    const wp = { sendNotification: vi.fn() };
    expect((await deliver(wp, { ...sub, endpoint: 'https://169.254.169.254/x' }, '{}', vapid)).outcome).toBe('blocked');
    expect(wp.sendNotification).not.toHaveBeenCalled();
  });
  it.each([[404, 'gone'], [410, 'gone'], [401, 'rejected'], [403, 'rejected'], [400, 'rejected'], [413, 'rejected'], [429, 'error'], [500, 'error'], [503, 'error'], [undefined, 'error']])(
    'status %s -> %s (só 404/410 permitem apagar a assinatura)', async (st, out) => {
      expect((await deliver(wpThrows(st as number | undefined), sub, '{}', vapid)).outcome).toBe(out);
    });
});

it('buildPayload mantém o contrato lido por public/sw-push.js', () => {
  const p = JSON.parse(buildPayload({ title: 't', body: 'b', data: { url: '/x' } }));
  expect(p).toMatchObject({ title: 't', body: 'b', tag: 'notification', requireInteraction: false, data: { url: '/x' }, icon: '/pwa-192x192.png' });
});
