import { createClient } from "npm:@supabase/supabase-js@2";
import {
  handleCorsAndMethod,
  withAuthOrServiceRole,
  isServiceRoleCaller,
  jsonError,
  jsonOk,
  guardBody,
} from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

interface PushPayload {
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
}

async function sendWebPush(subscription: Subscription, payload: PushPayload): Promise<boolean> {
  try {
    const pushData = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data || {},
      tag: payload.tag || 'notification',
      requireInteraction: payload.requireInteraction || false
    });

    const response = await fetchAPI(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
      },
      body: pushData
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        console.log('Subscription expired, should be removed');
        return false;
      }
      const errText = await response.text();
      console.error('Push failed:', response.status, errText);
      return false;
    }
    await response.text(); // consume body

    return true;
  } catch (error) {
    console.error('Error sending push:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;

  const authResult = await withAuthOrServiceRole(req);
  if (authResult instanceof Response) return authResult;

  if (!isServiceRoleCaller(authResult)) {
    const rl = limiter.check(authResult, req);
    if (rl) return rl;
  }

  const { body: rawPush, error: bodyError } = await guardBody(req, 16 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = rawPush as PushPayload;
    
    if (!payload.title || !payload.body) {
      return jsonError('Title and body are required', 400);
    }

    let targetUserId: string;
    if (isServiceRoleCaller(authResult)) {
      // Service-role callers (crons) must specify userId
      if (!payload.userId) return jsonError('userId required for service-role calls', 400);
      targetUserId = payload.userId;
    } else {
      // User JWT — only allow sending to self
      targetUserId = authResult;
      if (payload.userId && payload.userId !== authResult) {
        return jsonError('Cannot send notifications to other users', 403);
      }
    }

    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return jsonOk({ success: true, message: 'No subscriptions found', sent: 0 });
    }

    const results = await Promise.all(
      subscriptions.map(sub => sendWebPush(sub, payload))
    );

    const successCount = results.filter(Boolean).length;

    return jsonOk({ 
      success: true, 
      sent: successCount,
      total: subscriptions.length
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return jsonError(errorMessage, 500);
  }
});
