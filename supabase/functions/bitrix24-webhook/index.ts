import { createClient } from 'npm:@supabase/supabase-js@2';
import { guardBody, handleCorsAndMethod, jsonError, jsonOk, requireWebhookSecret } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

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

  const authCheck = await requireWebhookSecret(req, 'BITRIX24_WEBHOOK_SECRET', 'x-bitrix24-secret');
  if (authCheck) return authCheck;

  const { body: rawBody, error: bodyError } = await guardBody(req, 512 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Bitrix24 sends data as form-urlencoded or JSON
    let payload: BitrixCallEvent;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      payload = rawBody as BitrixCallEvent;
    } else {
      // Handle form-urlencoded data
      const formData = await req.formData();
      payload = {
        event: formData.get('event') as string || '',
        data: {
          CALL_ID: formData.get('data[CALL_ID]') as string,
          PHONE_NUMBER: formData.get('data[PHONE_NUMBER]') as string,
          CALL_TYPE: parseInt(formData.get('data[CALL_TYPE]') as string) || undefined,
          CALL_DURATION: parseInt(formData.get('data[CALL_DURATION]') as string) || undefined,
          CALL_START_DATE: formData.get('data[CALL_START_DATE]') as string,
          CALL_RECORD_URL: formData.get('data[CALL_RECORD_URL]') as string,
          PORTAL_USER_ID: formData.get('data[PORTAL_USER_ID]') as string,
          CRM_ENTITY_TYPE: formData.get('data[CRM_ENTITY_TYPE]') as string,
          CRM_ENTITY_ID: formData.get('data[CRM_ENTITY_ID]') as string,
        }
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
    const msg = error instanceof Error ? error.message : "Unknown error";
    log.error("fatal_error", { error: msg });
    return jsonError(msg, 500, req);
  }
});
