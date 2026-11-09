// Web Push (RFC 8030 / 8291 / 8292) — lógica PURA (sem APIs do Deno), para poder ser testada no vitest.
// A criptografia aes128gcm e a assinatura VAPID são feitas pela biblioteca `web-push` (injetada em `deliver`).

/** Serviços de push dos navegadores. O endpoint vem de uma linha que o PRÓPRIO usuário grava: sem allowlist o sender viraria SSRF. */
export const PUSH_HOST_SUFFIXES = [
  'fcm.googleapis.com',          // Chrome, Edge, Opera, Samsung, Brave
  'android.googleapis.com',
  'push.services.mozilla.com',   // Firefox
  'push.apple.com',              // Safari / iOS (web.push.apple.com)
  'notify.windows.com',          // WNS (Edge legado)
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  let u: URL;
  try { u = new URL(endpoint); } catch { return false; }
  if (u.protocol !== 'https:' || u.username || u.password) return false;
  if (u.port && u.port !== '443') return false;
  const h = u.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some((s) => h === s || h.endsWith(`.${s}`));
}

export interface VapidConfig { publicKey: string; privateKey: string; subject: string }

const B64URL = /^[A-Za-z0-9_-]+$/;

/** Lê o par VAPID do ambiente. `null` = não configurado (o sender responde 503 e NÃO apaga assinatura nenhuma). */
export function readVapidConfig(get: (k: string) => string | undefined): VapidConfig | null {
  const publicKey = (get('VAPID_PUBLIC_KEY') ?? '').trim();
  const privateKey = (get('VAPID_PRIVATE_KEY') ?? '').trim();
  // chave pública P-256 não comprimida = 65 bytes = 87 chars base64url; privada = 32 bytes = 43 chars
  if (!B64URL.test(publicKey) || publicKey.length !== 87) return null;
  if (!B64URL.test(privateKey) || privateKey.length !== 43) return null;
  // o subject é um contato (mailto: ou https:) enviado aos serviços de push; sem VAPID_SUBJECT usa a URL do projeto (nada pessoal)
  const subject = (get('VAPID_SUBJECT') ?? get('SUPABASE_URL') ?? '').trim();
  if (!/^(mailto:[^\s@]+@[^\s@]+|https:\/\/[^\s]+)$/.test(subject)) return null;
  return { publicKey, privateKey, subject };
}

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

export function buildPayload(p: PushPayload): string {
  return JSON.stringify({
    title: p.title,
    body: p.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: p.data || {},
    tag: p.tag || 'notification',
    requireInteraction: p.requireInteraction || false,
  });
}

export interface PushSubscriptionRow { endpoint: string; p256dh: string; auth: string }
export interface WebPushLike {
  sendNotification(
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    options: Record<string, unknown>,
  ): Promise<unknown>;
}

/**
 * sent     entregue ao serviço de push
 * gone     404/410: a assinatura não existe mais -> PODE apagar a linha
 * rejected outro 4xx (ex.: 401/403 = chave VAPID diferente da usada na assinatura): NÃO apagar, o app reassina sozinho
 * error    5xx / rede / 429: tenta de novo na próxima notificação, NÃO apagar
 * blocked  endpoint fora da allowlist: nada é enviado
 */
export type PushOutcome = 'sent' | 'gone' | 'rejected' | 'error' | 'blocked';

export async function deliver(
  wp: WebPushLike,
  sub: PushSubscriptionRow,
  payload: string,
  vapid: VapidConfig,
  timeoutMs = 15_000,
): Promise<{ outcome: PushOutcome; status?: number }> {
  if (!isAllowedPushEndpoint(sub.endpoint)) return { outcome: 'blocked' };
  try {
    await wp.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
      { vapidDetails: { subject: vapid.subject, publicKey: vapid.publicKey, privateKey: vapid.privateKey }, TTL: 86_400, urgency: 'normal', timeout: timeoutMs },
    );
    return { outcome: 'sent' };
  } catch (e) {
    const status = (e as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) return { outcome: 'gone', status };
    if (status && status >= 400 && status < 500 && status !== 429) return { outcome: 'rejected', status };
    return { outcome: 'error', status };
  }
}
