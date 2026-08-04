import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";
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

  const { body: rawBody, error: bodyError } = await guardBody(req, 512 * 1024);
  if (bodyError) return bodyError;

  const parsed = bodySchema.safeParse(rawBody);
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

  // Pre-assign UUIDs so transcriptions and logs can be bulk-inserted without needing DB-returned IDs
  type PendingMessage = {
    index: number;
    msgId: string;
    row: Record<string, unknown>;
    safeContactId: string | null;
    safeCompanyId: string | null;
    hasTranscription: boolean;
    m: typeof parsed.data.messages[number];
  };
  const pendingMessages: PendingMessage[] = [];

  for (let i = 0; i < parsed.data.messages.length; i++) {
    const m = parsed.data.messages[i];
    const isAudio = m.message_type === 'audio';
    const hasTranscription = !!m.transcription;
    const transcription_status = isAudio
      ? hasTranscription ? 'done' : 'pending'
      : 'not_applicable';
    const safeContactId = m.contact_id && allowedContactIds.has(m.contact_id) ? m.contact_id : null;
    const safeCompanyId = m.company_id && allowedCompanyIds.has(m.company_id) ? m.company_id : null;
    const msgId = crypto.randomUUID();
    pendingMessages.push({
      index: i, msgId, safeContactId, safeCompanyId, hasTranscription, m,
      row: {
        id: msgId,
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
      },
    });
  }

  // Bulk-insert all messages in one query; track which indexes failed
  const { error: bulkInsertErr, data: insertedMsgs } = await admin
    .from('whatsapp_messages')
    .insert(pendingMessages.map(p => p.row))
    .select('id');

  const insertedIdSet = new Set((insertedMsgs ?? []).map((r: { id: string }) => r.id));
  const transcriptionRows: Array<Record<string, unknown>> = [];
  const logRows: Array<Record<string, unknown>> = [];

  if (bulkInsertErr) {
    // Whole batch failed — log each as failed
    for (const p of pendingMessages) {
      failed.push({ index: p.index, error: bulkInsertErr.message });
      logRows.push({
        user_id: userId, contact_id: p.m.contact_id ?? null,
        message_id: p.m.message_id ?? null, event_type: 'import', status: 'error',
        details: { error: bulkInsertErr.message },
      });
    }
  } else {
    for (const p of pendingMessages) {
      if (!insertedIdSet.has(p.msgId)) {
        failed.push({ index: p.index, error: 'insert_not_confirmed' });
        logRows.push({
          user_id: userId, contact_id: p.m.contact_id ?? null,
          message_id: p.m.message_id ?? null, event_type: 'import', status: 'error',
          details: { error: 'insert_not_confirmed' },
        });
        continue;
      }
      inserted.push(p.msgId);
      logRows.push({
        user_id: userId, contact_id: p.safeContactId,
        message_id: p.m.message_id ?? null, event_type: 'import', status: 'ok',
        details: { message_type: p.m.message_type, company_id: p.safeCompanyId },
      });
      if (p.hasTranscription) {
        transcriptionRows.push({
          whatsapp_message_id: p.msgId,
          content: p.m.transcription!,
          provider: p.m.transcription_provider ?? 'manual',
          confidence: p.m.transcription_confidence ?? null,
        });
      }
    }
  }

  // Bulk-flush transcriptions and logs in parallel
  await Promise.all([
    transcriptionRows.length > 0 ? admin.from('whatsapp_transcriptions').insert(transcriptionRows) : Promise.resolve(),
    logRows.length > 0 ? admin.from('whatsapp_ingestion_logs').insert(logRows) : Promise.resolve(),
  ]);

  return json(req, { inserted_count: inserted.length, failed_count: failed.length, inserted, failed }, 200);
});

function json(req: Request, body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...scopedCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}