import { createClient } from "npm:@supabase/supabase-js@2";
import {
  handleCorsAndMethod,
  withAuthOrServiceRole,
  isServiceRoleCaller,
  jsonError,
  jsonOk,
  guardBody,
} from "../_shared/auth.ts";
import { validate } from "../_shared/validate.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import webpush from "npm:web-push@3.6.7";
import { buildPayload, deliver, readVapidConfig, type PushPayload } from "../_shared/push.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

interface SendPayload extends PushPayload {
  userId?: string;
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

  const vapid = readVapidConfig((k) => Deno.env.get(k));
  if (!vapid) {
    // Par VAPID ausente/inválido: NÃO tenta enviar e NÃO apaga assinatura (todas continuam válidas até configurar os secrets)
    console.error('push_not_configured: defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY (Cloud -> Secrets)');
    return jsonError('Push notifications not configured', 503, req);
  }

  const { body: rawPush, error: bodyError } = await guardBody(req, 16 * 1024);
  if (bodyError) return bodyError;

  const v = validate(rawPush, {
    title: { type: 'string', required: true, maxLength: 200 },
    body:  { type: 'string', required: true, maxLength: 1000 },
    userId: { type: 'string', maxLength: 36 },
    tag:  { type: 'string', maxLength: 64 },
  });
  if (!v.ok) return jsonError(v.error, 400, req);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = rawPush as SendPayload;

    let targetUserId: string;
    if (isServiceRoleCaller(authResult)) {
      // Service-role callers (crons) must specify userId
      if (!payload.userId) return jsonError('userId required for service-role calls', 400, req);
      targetUserId = payload.userId;
    } else {
      // User JWT — only allow sending to self
      targetUserId = authResult;
      if (payload.userId && payload.userId !== authResult) {
        return jsonError('Cannot send notifications to other users', 403, req);
      }
    }

    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return jsonOk({ success: true, message: 'No subscriptions found', sent: 0 }, req);
    }

    const body = buildPayload(payload);
    const results = await Promise.all(subscriptions.map((sub) => deliver(webpush, sub, body, vapid)));

    // 404/410 = assinatura morta: remove SÓ essas linhas (e só do usuário alvo). 401/403/5xx não apagam nada.
    const gone = subscriptions.filter((_, i) => results[i].outcome === 'gone').map((s) => s.endpoint);
    if (gone.length) {
      const { error: delError } = await supabaseClient.from('push_subscriptions').delete().eq('user_id', targetUserId).in('endpoint', gone);
      if (delError) console.error('push cleanup failed:', delError.message);
    }
    const count = (o: string) => results.filter((r) => r.outcome === o).length;

    return jsonOk({
      success: true,
      sent: count('sent'),
      total: subscriptions.length,
      removed: gone.length,
      rejected: count('rejected'),
      failed: count('error'),
      blocked: count('blocked'),
    }, req);
  } catch (error: unknown) {
    console.error('Error:', error);
    return jsonError('Internal server error', 500, req);
  }
});
