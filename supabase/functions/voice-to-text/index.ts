import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuthOrServiceRole, isServiceRoleCaller, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { z } from "npm:zod@3.23.8";

const bodySchema = z.object({
  audio:             z.string().optional(),
  whatsappMessageId: z.string().uuid().optional(),
  autoSave:          z.boolean().optional(),
  contactId:         z.string().uuid().optional(),
  companyId:         z.string().uuid().optional(),
  userId:            z.string().uuid().optional(),
});

const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Muitas transcrições. Aguarde antes de tentar novamente." });

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;

  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authResult = await withAuthOrServiceRole(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { body, error: bodyError } = await guardBody(req, 10 * 1024 * 1024); // 10 MB ceiling for base64 audio
    if (bodyError) return bodyError;

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid request body", 400, req);
    }
    const { audio, whatsappMessageId, autoSave, contactId, companyId, userId: providedUserId } = parsed.data;

    const userId = isServiceRoleCaller(authResult) ? providedUserId : authResult;

    if (!audio && !whatsappMessageId) {
      return jsonError('No audio data or message ID provided', 400, req);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let audioData = audio;

    if (whatsappMessageId && !audio) {
      const { data: msg } = await supabase.from('whatsapp_messages').select('content, metadata').eq('id', whatsappMessageId).eq('user_id', userId).single();
      if (msg?.content?.startsWith('data:audio')) audioData = msg.content;
    }

    if (!audioData) {
      return jsonError('Audio content could not be retrieved', 400, req);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetchAI('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de transcrição de elite. Transcreva o áudio de forma literal e depois forneça um resumo executivo entre colchetes. Responda em Português do Brasil.'
          },
          {
            role: 'user',
            content: [
              { type: "text", text: "Por favor, transcreva este áudio de WhatsApp/Ligação." },
              { type: "input_file", data: audioData.includes(',') ? audioData.split(',')[1] : audioData, format: "mp3" }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const transcribedText = result.choices?.[0]?.message?.content || 'Falha na transcrição';

    let interactionId = null;
    if (autoSave && userId && (contactId || whatsappMessageId)) {
      const { data: interaction, error: intError } = await supabase
        .from('interactions')
        .insert({
          user_id: userId,
          contact_id: contactId,
          company_id: companyId,
          type: 'whatsapp',
          title: 'Transcrição Automática (Voz)',
          content: transcribedText,
          transcription: transcribedText,
          sentiment: 'neutral',
          tags: ['auto-transcribed', 'voice-to-text']
        })
        .select('id')
        .single();

      if (!intError) interactionId = interaction?.id ?? null;

      if (whatsappMessageId) {
        await bestEffortWrite(supabase.from('whatsapp_messages').update({ content: transcribedText }).eq('id', whatsappMessageId).eq('user_id', userId), 'whatsapp_messages update error:');
      }
    }

    return jsonOk({ success: true, text: transcribedText, interactionId }, req);

  } catch (error: unknown) {
    console.error("voice-to-text error:", error);
    return jsonError("Internal server error", 500, req);
  }
});
