import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireWebhookSecret, scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

import { jsonResponse } from "./helpers.ts";
import { handleMessageUpsert, handleMessageUpdate, handleSendMessage } from "./messages.ts";
import { handleConnectionUpdate, handleContactsUpsert, handlePresenceUpdate, handleCall } from "./events.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 200 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  // Reject requests that don't carry the shared Evolution API secret
  const authCheck = await requireWebhookSecret(req, 'EVOLUTION_API_SECRET', 'apikey');
  if (authCheck) return authCheck;

  const { body: rawBody, error: bodyError } = await guardBody(req, 5 * 1024 * 1024); // 5 MB — WhatsApp media payloads
  if (bodyError) return bodyError;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = rawBody;
    const event = payload && typeof payload === 'object' && 'event' in payload ? payload.event : undefined;
    const instance = payload && typeof payload === 'object' && 'instance' in payload ? payload.instance : undefined;
    if (typeof instance !== 'string') {
      return jsonResponse({ error: 'Invalid instance' }, 400);
    }

    // Evolution webhook [${event}] from instance: ${instance}`);

    // Route to handler based on event type
    switch (event) {
      case 'messages.upsert':
        return await handleMessageUpsert(supabase, payload, instance);

      case 'messages.update':
        return await handleMessageUpdate(supabase, payload, instance);

      case 'connection.update':
        return await handleConnectionUpdate(supabase, payload, instance);

      case 'contacts.upsert':
        return await handleContactsUpsert(supabase, payload, instance);

      case 'presence.update':
        return await handlePresenceUpdate(supabase, payload, instance);

      case 'call':
        return await handleCall(supabase, payload, instance);

      case 'send.message':
        return await handleSendMessage(supabase, payload, instance);

      default:
        // Unhandled event: ${event}`);
        return jsonResponse({ status: 'ignored', event });
    }

  } catch (error) {
    console.error('Evolution webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
