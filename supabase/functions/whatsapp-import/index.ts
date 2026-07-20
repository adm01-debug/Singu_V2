import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';
import { scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: scopedCorsHeaders(req) });
  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json(req, { error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const authed = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await authed.auth.getUser();
  if (userErr || !userData.user) return json(req, { error: 'Invalid token' }, 401);
  const userId = userData.user.id;

  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return json(req, { error: 'Invalid JSON' }, 400);
  }
  if (!parsed.success) return json(req, { error: parsed.error.flatten() }, 400);

  const admin = createClient(supabaseUrl, serviceKey);
  const inserted: string[] = [];
  const failed: Array<{ index: number; error: string }> = [];

  // Batch-verify contact and company ownership before processing
  const contactIds = [...new Set(parsed.data.messages.map(m => m.contact_id).filter(Boolean) as string[])];
  const companyIds = [...new Set(parsed.data.messages.map(m => m.company_id).filter(Boolean) as string[])];

  const allowedContactIds = new Set<string>();
  const allowedCompanyIds = new Set<string>();

  if (contactIds.length > 0) {
    const { data: ownedContacts } = await admin.from('contacts').select('id').in('id', contactIds).eq('user_id', userId);
    (ownedContacts ?? []).forEach(c => allowedContactIds.add(c.id));
  }
  if (companyIds.length > 0) {
    const { data: ownedCompanies } = await admin.from('companies').select('id').in('id', companyIds).eq('user_id', userId);
    (ownedCompanies ?? []).forEach(c => allowedCompanyIds.add(c.id));
  }

  for (let i = 0; i < parsed.data.messages.length; i++) {
    const m = parsed.data.messages[i];
    try {
      const isAudio = m.message_type === 'audio';
      const hasTranscription = !!m.transcription;
      const transcription_status = isAudio
        ? hasTranscription ? 'done' : 'pending'
        : 'not_applicable';

      // Only attach to contacts/companies that belong to this user
      const safeContactId = m.contact_id && allowedContactIds.has(m.contact_id) ? m.contact_id : null;
      const safeCompanyId = m.company_id && allowedCompanyIds.has(m.company_id) ? m.company_id : null;

      const row = {
        user_id: userId,
        contact_id: safeContactId,
        company_id: safeCompanyId,
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
        contact_id: safeContactId,
        message_id: m.message_id ?? null,
        event_type: 'import',
        status: 'ok',
        details: { message_type: m.message_type, company_id: safeCompanyId },
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

  return json(req, { inserted_count: inserted.length, failed_count: failed.length, inserted, failed }, 200);
});

function json(req: Request, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...scopedCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}