import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Rate limit exceeded for Lux Intelligence. Please wait." });

const LuxTriggerSchema = z.object({
  entityType: z.enum(['contact', 'company']),
  entityId: z.string().uuid('entityId must be a valid UUID'),
  entityData: z.record(z.unknown()).optional(),
});

/** Fetch with timeout */
async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Retry with exponential backoff */
async function retryFetch(
  url: string,
  opts: RequestInit,
  maxRetries: number,
  timeoutMs: number,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, opts, timeoutMs);
      if (res.ok) return { ok: true, status: res.status };
      const body = await res.text().catch(() => "");
      console.warn(`[lux-trigger] Webhook attempt ${attempt + 1}/${maxRetries + 1} failed: ${res.status} ${body}`);
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
        await new Promise(r => setTimeout(r, delay));
      }
      if (attempt === maxRetries) return { ok: false, status: res.status, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[lux-trigger] Webhook attempt ${attempt + 1}/${maxRetries + 1} error: ${msg}`);
      if (attempt === maxRetries) return { ok: false, error: msg };
      const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return { ok: false, error: "Max retries exceeded" };
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { body: gbBody, error: gbErr } = await guardBody(req, 128 * 1024);
  if (gbErr) return gbErr;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const parsed = LuxTriggerSchema.safeParse(gbBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input',
        details: parsed.error.flatten().fieldErrors,
      }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { entityType, entityId, entityData } = parsed.data;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Lookup webhook config from lux_webhook_config table
    const { data: webhookConfig } = await serviceClient
      .from('lux_webhook_config')
      .select('*')
      .eq('entity_type', entityType)
      .eq('is_active', true)
      .maybeSingle();

    // Fallback to env var
    const webhookUrl = webhookConfig?.webhook_url || Deno.env.get('N8N_LUX_WEBHOOK_URL');
    const timeoutMs = webhookConfig?.timeout_ms || 60000;
    const maxRetries = webhookConfig?.max_retries || 3;

    if (!webhookUrl) {
      console.error('[lux-trigger] No webhook URL configured for', entityType);
      return new Response(JSON.stringify({ 
        error: 'not_configured',
        message: 'Webhook não configurado para este tipo de entidade',
      }), {
        status: 422, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Create lux_intelligence record
    const { data: luxRecord, error: insertError } = await serviceClient
      .from('lux_intelligence')
      .insert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('[lux-trigger] Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create intelligence record' }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/lux-webhook`;

    console.log(`[lux-trigger] Calling webhook for ${entityType}/${entityId}, url=${webhookUrl}, timeout=${timeoutMs}ms, retries=${maxRetries}`);

    const result = await retryFetch(
      webhookUrl,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          luxRecordId: luxRecord.id,
          entityType,
          entityId,
          entityData,
          userId: user.id,
          callbackUrl,
        }),
      },
      maxRetries,
      timeoutMs,
    );

    if (!result.ok) {
      console.error(`[lux-trigger] Webhook failed after retries: ${result.error}`);
      await serviceClient
        .from('lux_intelligence')
        .update({ status: 'error', error_message: `Webhook failed: ${result.error}` })
        .eq('id', luxRecord.id);
    } else {
      console.log(`[lux-trigger] Webhook triggered successfully (status=${result.status})`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      luxRecordId: luxRecord.id,
      webhookStatus: result.ok ? 'sent' : 'failed',
      message: result.ok ? 'Lux intelligence scan started' : 'Scan criado mas webhook falhou',
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[lux-trigger] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
