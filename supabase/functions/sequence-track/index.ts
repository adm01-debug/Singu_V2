// Pixel de tracking + redirect de cliques para sequências
import { createClient } from 'npm:@supabase/supabase-js@2';
import { scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 120 });

// 1x1 GIF transparente
const PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
]);

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const url = new URL(req.url);
  const action = url.searchParams.get('a'); // 'open' | 'click'
  const token = url.searchParams.get('t');
  const target = url.searchParams.get('u');

  if (!token || !action) {
    return new Response('Missing params', { status: 400, headers: cors });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { data: log } = await supabase
      .from('sequence_send_log')
      .select('id, enrollment_id, sequence_id, contact_id, user_id, step_order, opened_at, clicked_at')
      .eq('tracking_token', token)
      .maybeSingle();

    if (log) {
      const now = new Date().toISOString();
      const update: Record<string, string> = {};
      if (action === 'open' && !log.opened_at) update.opened_at = now;
      if (action === 'click') {
        update.clicked_at = now;
        if (!log.opened_at) update.opened_at = now;
      }

      if (Object.keys(update).length > 0) {
        const [upd, ins] = await Promise.all([
          supabase.from('sequence_send_log').update(update).eq('id', log.id),
          supabase.from('sequence_events').insert({
            enrollment_id: log.enrollment_id,
            sequence_id: log.sequence_id,
            contact_id: log.contact_id,
            user_id: log.user_id,
            step_order: log.step_order,
            event_type: action === 'open' ? 'opened' : 'clicked',
            metadata: { url: target ?? null },
          }),
        ]);
        if (upd.error) console.error('sequence_send_log update failed:', upd.error.message);
        if (ins.error) console.error('sequence_events insert failed:', ins.error.message);
      }
    }
  } catch (e) {
    console.error('Tracking error:', e);
  }

  if (action === 'click' && target) {
    // Block open redirect: only allow https:// URLs — reject javascript:, data:, etc.
    let safeTarget: string;
    try {
      const parsed = new URL(target);
      if (parsed.protocol !== 'https:') throw new Error('non-https');
      safeTarget = parsed.toString();
    } catch {
      return new Response('Invalid redirect target', { status: 400, headers: cors });
    }
    return new Response(null, {
      status: 302,
      headers: { ...cors, Location: safeTarget },
    });
  }

  return new Response(PIXEL, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
});
