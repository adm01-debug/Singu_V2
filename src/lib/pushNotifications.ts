import { supabase } from '@/integrations/supabase/client';
import { logger } from "@/lib/logger";

// VAPID public key - this should be generated and stored securely
// For now, we'll generate it dynamically or use a placeholder
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

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

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    logger.warn('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw-push.js', {
      scope: '/'
    });
    logger.info('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Service Worker registration failed:', { error: msg });
    return null;
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    // Check if already subscribed
    let subscription = await registration.pushManager?.getSubscription();
    
    if (!subscription) {
      // Subscribe to push notifications
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager?.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });
    }

    // Save subscription to database
    await saveSubscription(subscription);
    
    return subscription;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to subscribe to push notifications:', { error: msg });
    return null;
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
