import { supabase } from '@/integrations/supabase/client';
import { logger } from "@/lib/logger";

// Chave VAPID PÚBLICA do projeto (é pública por definição). A privada vive só no secret VAPID_PRIVATE_KEY das edge functions.
// A chave que existia aqui era o EXEMPLO público da biblioteca web-push (a privada correspondente é pública): quem a usasse
// podia enviar push em nome do app. Pode ser sobrescrita no build por VITE_VAPID_PUBLIC_KEY.
const VAPID_PUBLIC_KEY: string = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() || 'BMDBjwD-dcEXU9-8Vrtv8xEnZE_Kb4Fga3USqiCjuIXwSOkOcBYb6n0qCFQ0Yhb7tY5HDfwN4f9CM2SltnkwcNA';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const SW_READY_TIMEOUT_MS = 10_000;

/**
 * Returns the registration of the app's single service worker.
 *
 * In production that is the VitePWA Workbox SW (scope "/"), which already
 * contains the push handlers from public/sw-push.js (workbox.importScripts).
 * Registering /sw-push.js here would replace it at the same scope and drop the
 * precache + push subscription, so we only WAIT for `ready`.  In dev there is
 * no built SW, so sw-push.js is registered directly to keep push testable.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service Worker not supported');
    return null;
  }

  try {
    if (!import.meta.env.PROD) {
      return await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS);
    });
    const registration = await Promise.race([navigator.serviceWorker.ready, timeout]);
    if (timer) clearTimeout(timer);
    if (!registration) logger.warn('Service Worker not ready after timeout');
    return registration;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Service Worker registration failed:', { error: msg });
    return null;
  }
}

/** true se a assinatura foi criada com a chave VAPID atual. Navegador que não informa a chave (null) = não dá para saber: não mexe. */
function usesCurrentKey(subscription: PushSubscription): boolean {
  const raw = subscription.options?.applicationServerKey;
  if (!raw) return true;
  const have = new Uint8Array(raw);
  const want = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  return have.length === want.length && have.every((v, i) => v === want[i]);
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    let subscription = await registration.pushManager?.getSubscription();
    let staleEndpoint: string | null = null;

    // Assinatura feita com OUTRA chave (a de exemplo antiga): o serviço de push a rejeita e subscribe() com chave diferente
    // dá InvalidStateError. Cancela e refaz com a chave atual; a permissão já concedida é mantida (sem novo prompt).
    if (subscription && !usesCurrentKey(subscription)) {
      staleEndpoint = subscription.endpoint;
      await subscription.unsubscribe();
      subscription = null;
    }

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager?.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });
    }

    // grava a nova ANTES de apagar a antiga: se a gravação falhar, a linha velha continua lá (nada se perde)
    await saveSubscription(subscription);
    if (staleEndpoint) await removeSubscription(staleEndpoint);

    return subscription;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to subscribe to push notifications:', { error: msg });
    return null;
  }
}

/**
 * Migra em silêncio quem já tem permissão e uma assinatura criada com outra chave VAPID. Barato: só olha a assinatura local.
 * Retorna true se reassinou.
 */
export async function ensureCurrentPushSubscription(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager?.getSubscription();
    if (!existing || usesCurrentKey(existing)) return false;
    return (await subscribeToPush()) !== null;
  } catch (error) {
    logger.warn('ensureCurrentPushSubscription failed:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager?.getSubscription();
    
    if (subscription) {
      // Remove from database first
      await removeSubscription(subscription.endpoint);
      
      // Then unsubscribe
      await subscription.unsubscribe();
    }
    
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to unsubscribe from push notifications:', { error: msg });
    return false;
  }
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error('User not authenticated');

  const subscriptionJSON = subscription.toJSON();
  const keys = subscriptionJSON.keys as { p256dh: string; auth: string };

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth
    }, {
      onConflict: 'user_id,endpoint'
    });

  if (error) {
    const msg = error.message || 'Unknown error';
    logger.error('Failed to save subscription:', { error: msg });
    throw error;
  }
}

async function removeSubscription(endpoint: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) {
    const msg = error.message || 'Unknown error';
    logger.error('Failed to remove subscription:', { error: msg });
  }
}

export async function getSubscriptionStatus(): Promise<{
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { isSubscribed: false, subscription: null };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager?.getSubscription();
    return { isSubscribed: !!subscription, subscription };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to get subscription status:', { error: msg });
    return { isSubscribed: false, subscription: null };
  }
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}
