import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const messageSchema = z.object({
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  instance_name: z.string().min(1).max(100).default('manual'),
  remote_jid: z.string().min(1).max(100),
  message_id: z.string().max(200).optional().nullable(),
  from_me: z.boolean().default(false),
  message_type: z.enum(['text', 'audio', 'image', 'video', 'document', 'sticker']).default('text'),
  content: z.string().max(20000).optional().nullable(),
  media_url: z.string().url().max(2048).optional().nullable(),
  media_mimetype: z.string().max(100).optional().nullable(),
  sender_name: z.string().max(200).optional().nullable(),
  duration_seconds: z.number().int().min(0).max(86400).optional().nullable(),
  timestamp: z.string().datetime().optional(),
  transcription: z.string().max(20000).optional().nullable(),
  transcription_provider: z.string().max(50).optional().nullable(),
  transcription_confidence: z.number().min(0).max(1).optional().nullable(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(200),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await authed.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'Invalid token' }, 401);
  const userId = userData.user.id;

  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);

  const admin = createClient(supabaseUrl, serviceKey);
  const inserted: string[] = [];
  const failed: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < parsed.data.messages.length; i++) {
    const m = parsed.data.messages[i];
    try {
      const isAudio = m.message_type === 'audio';
      const hasTranscription = !!m.transcription;
      const transcription_status = isAudio
        ? hasTranscription ? 'done' : 'pending'
        : 'not_applicable';

      const row = {
        user_id: userId,
        contact_id: m.contact_id ?? null,
        company_id: m.company_id ?? null,
        instance_name: m.instance_name,
        remote_jid: m.remote_jid,
        message_id: m.message_id ?? null,
        from_me: m.from_me,
        message_type: m.message_type,
        content: m.content ?? null,
        media_url: m.media_url ?? null,
        media_mimetype: m.media_mimetype ?? null,
        sender_name: m.sender_name ?? null,
        duration_seconds: m.duration_seconds ?? null,
        timestamp: m.timestamp ?? new Date().toISOString(),
        transcription_status,
      };

      const { data: msg, error: insertErr } = await admin
        .from('whatsapp_messages')
        .insert(row)
        .select('id')
        .single();
      if (insertErr) throw insertErr;

      if (hasTranscription) {
        const { error: trErr } = await admin.from('whatsapp_transcriptions').insert({
          whatsapp_message_id: msg.id,
          content: m.transcription!,
          provider: m.transcription_provider ?? 'manual',
          confidence: m.transcription_confidence ?? null,
        });
        if (trErr) throw trErr;
      }

      await admin.from('whatsapp_ingestion_logs').insert({
        user_id: userId,
        contact_id: m.contact_id ?? null,
        message_id: m.message_id ?? null,
        event_type: 'import',
        status: 'ok',
        details: { message_type: m.message_type, company_id: m.company_id ?? null },
      });

      inserted.push(msg.id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      failed.push({ index: i, error: errorMsg });
      await admin.from('whatsapp_ingestion_logs').insert({
        user_id: userId,
        contact_id: m.contact_id ?? null,
        message_id: m.message_id ?? null,
        event_type: 'import',
        status: 'error',
        details: { error: errorMsg },
      });
    }
  }

  return json({ inserted_count: inserted.length, failed_count: failed.length, inserted, failed }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}