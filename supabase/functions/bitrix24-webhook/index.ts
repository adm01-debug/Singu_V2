import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardBody, handleCorsAndMethod, jsonError, jsonOk, requireWebhookSecret } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 100 });

interface BitrixCallEvent {
  event: string;
  data: {
    CALL_ID?: string;
    PHONE_NUMBER?: string;
    CALL_TYPE?: number; // 1 = outgoing, 2 = incoming
    CALL_DURATION?: number;
    CALL_START_DATE?: string;
    CALL_RECORD_URL?: string;
    PORTAL_USER_ID?: string;
    CRM_ENTITY_TYPE?: string;
    CRM_ENTITY_ID?: string;
    CALL_FAILED_CODE?: string;
    CALL_FAILED_REASON?: string;
  };
  auth?: {
    domain?: string;
    member_id?: string;
  };
}

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "bitrix24-webhook");

  const corsResp = handleCorsAndMethod(req);
  if (corsResp) return corsResp;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const authCheck = await requireWebhookSecret(req, 'BITRIX24_WEBHOOK_SECRET', 'x-bitrix24-secret');
  if (authCheck) return authCheck;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Bitrix24 sends data as form-urlencoded or JSON.
    // guardBody always calls req.json() so it must not be used for form-urlencoded:
    // check content-type first and parse accordingly.
    const MAX_BYTES = 512 * 1024;
    const cl = parseInt(req.headers.get('content-length') ?? '0', 10);
    if (cl > MAX_BYTES) return jsonError("Payload too large", 413, req);

    let payload: BitrixCallEvent;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const { body: rawBody, error: bodyError } = await guardBody(req, MAX_BYTES);
      if (bodyError) return bodyError;
      payload = rawBody as BitrixCallEvent;
    } else {
      // form-urlencoded: read raw text then parse with URLSearchParams
      const text = await req.text();
      if (text.length > MAX_BYTES) return jsonError("Payload too large", 413, req);
      const params = new URLSearchParams(text);
      payload = {
        event: params.get('event') || '',
        data: {
          CALL_ID: params.get('data[CALL_ID]') ?? undefined,
          PHONE_NUMBER: params.get('data[PHONE_NUMBER]') ?? undefined,
          CALL_TYPE: parseInt(params.get('data[CALL_TYPE]') ?? '') || undefined,
          CALL_DURATION: parseInt(params.get('data[CALL_DURATION]') ?? '') || undefined,
          CALL_START_DATE: params.get('data[CALL_START_DATE]') ?? undefined,
          CALL_RECORD_URL: params.get('data[CALL_RECORD_URL]') ?? undefined,
          PORTAL_USER_ID: params.get('data[PORTAL_USER_ID]') ?? undefined,
          CRM_ENTITY_TYPE: params.get('data[CRM_ENTITY_TYPE]') ?? undefined,
          CRM_ENTITY_ID: params.get('data[CRM_ENTITY_ID]') ?? undefined,
        },
      };
    }

    log.info("webhook_received", { event: payload.event });

    // Handle call finish events
    const validEvents = ['ONVOXIMPLANTCALLEND', 'ONEXTERNALCALLFINISH', 'ONCRMCALLEND'];
    if (!validEvents.includes(payload.event?.toUpperCase())) {
      log.info("event_ignored", { event: payload.event });
      return jsonOk({ 
        status: 'ignored', 
        reason: 'not a call end event',
        event: payload.event 
      }, req);
    }

    const { data } = payload;
    
    // Clean phone number (remove country code formatting)
    let phoneNumber = data.PHONE_NUMBER?.replace(/\D/g, '') || '';
    if (phoneNumber.startsWith('55') && phoneNumber.length > 11) {
      phoneNumber = phoneNumber.substring(2); // Remove Brazil country code
    }

    const isOutgoing = data.CALL_TYPE === 1;
    const duration = data.CALL_DURATION || 0;
    const callDate = data.CALL_START_DATE ? new Date(data.CALL_START_DATE) : new Date();

    // Find contact by phone number
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, user_id, first_name, last_name, company_id')
      .or(`phone.ilike.%${phoneNumber}%,whatsapp.ilike.%${phoneNumber}%`)
      .limit(1);

    if (contactError) {
      log.error("find_contact_failed", { error: contactError.message, phone: phoneNumber });
      throw contactError;
    }

    if (!contacts || contacts.length === 0) {
      log.info("contact_not_found", { phone: phoneNumber });
      return jsonOk({ 
        status: 'skipped', 
        reason: 'contact not found',
        phone: phoneNumber 
      }, req);
    }

    const contact = contacts[0];

    // Format duration as MM:SS
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Determine call outcome
    let callOutcome = 'Ligação completada';
    if (duration === 0) {
      callOutcome = data.CALL_FAILED_REASON || 'Ligação não atendida';
    }

    // Create interaction
    const interactionData = {
      contact_id: contact.id,
      company_id: contact.company_id,
      user_id: contact.user_id,
      type: 'call',
      title: isOutgoing 
        ? `Ligação Realizada para ${contact.first_name}` 
        : `Ligação Recebida de ${contact.first_name}`,
      content: `${callOutcome}\nDuração: ${durationFormatted}`,
      sentiment: duration > 0 ? 'neutral' : 'negative',
      initiated_by: isOutgoing ? 'us' : 'them',
      follow_up_required: duration === 0, // Follow up if call wasn't answered
      duration: duration,
      audio_url: data.CALL_RECORD_URL || null,
      tags: ['bitrix24', 'auto-imported'],
      created_at: callDate.toISOString(),
    };

    const { data: interaction, error: interactionError } = await supabase
      .from('interactions')
      .insert(interactionData)
      .select()
      .single();

    if (interactionError) {
      log.error("create_interaction_failed", { error: interactionError.message, contactId: contact.id });
      throw interactionError;
    }

    log.info("interaction_created", { interactionId: interaction.id, contactId: contact.id });

    return jsonOk({ 
      status: 'success', 
      interactionId: interaction.id,
      contactId: contact.id,
      duration: durationFormatted,
      traceId
    }, req);

  } catch (error) {
    log.error("fatal_error", { error: error instanceof Error ? error.message : String(error) });
    return jsonError("Internal server error", 500, req);
  }
});
