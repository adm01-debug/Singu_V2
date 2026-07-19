import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireWebhookSecret, scopedCorsHeaders } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  // Reject requests that don't carry the shared Evolution API secret
  const authCheck = await requireWebhookSecret(req, 'EVOLUTION_API_SECRET', 'apikey');
  if (authCheck) return authCheck;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const event = payload.event;
    const instance = payload.instance;

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Helper: Find contact by phone number - searches local DB first, then external DB
async function findContactByPhone(supabase: any, phoneNumber: string): Promise<{
  contactId: string | null;
  userId: string | null;
  companyId: string | null;
  source: 'local' | 'external' | 'created' | null;
}> {
  // Clean phone number - remove country code prefix variations and non-digits
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Try multiple phone formats for matching
  const phoneVariants = [cleanPhone];
  // If starts with 55 (Brazil), also try without country code
  if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
    phoneVariants.push(cleanPhone.substring(2));
  }
  // If doesn't start with 55, also try with it
  if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
    phoneVariants.push('55' + cleanPhone);
  }

  // Searching contact for phone variants

  // 1. Search in LOCAL contacts table
  for (const variant of phoneVariants) {
    const { data: localContacts } = await supabase
      .from('contacts')
      .select('id, user_id, company_id')
      .or(`whatsapp.eq.${variant},phone.eq.${variant}`)
      .limit(1);

    if (localContacts && localContacts.length > 0) {
      // Found contact in local DB;
      return {
        contactId: localContacts[0].id,
        userId: localContacts[0].user_id,
        companyId: localContacts[0].company_id,
        source: 'local',
      };
    }
  }

  // 2. Search in EXTERNAL contacts database
  const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const externalKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');

  if (externalUrl && externalKey) {
    const externalSupabase = createClient(externalUrl, externalKey);

    for (const variant of phoneVariants) {
      // Search by phone fields in external DB - try multiple column names
      const { data: extContacts, error: extError } = await externalSupabase
        .from('contacts')
        .select('id, company_id, first_name, last_name, cargo, whatsapp, phone')
        .or(`whatsapp.eq.${variant},phone.eq.${variant}`)
        .limit(1);

      if (extError) {
        console.error('Error searching external contacts:', extError.message);
        continue;
      }

      if (extContacts && extContacts.length > 0) {
        const extContact = extContacts[0];
        // Found contact in external DB;

        // Get the default user (first user in profiles) to assign interaction
         // Try to find the user associated with this instance first
         const { data: instanceData } = await supabase
           .from('whatsapp_instances')
           .select('user_id')
           .eq('instance_name', instance)
           .maybeSingle();
 
         let defaultUserId = instanceData?.user_id;
 
         if (!defaultUserId) {
           // Fallback to first user in profiles as last resort
           const { data: profiles } = await supabase
             .from('profiles')
             .select('id')
             .limit(1);
           defaultUserId = profiles?.[0]?.id || null;
         }

        if (!defaultUserId) {
          console.error('No user found in profiles to assign interaction');
          return { contactId: extContact.id, userId: null, companyId: extContact.company_id, source: 'external' };
        }

        return {
          contactId: extContact.id,
          userId: defaultUserId,
          companyId: extContact.company_id,
          source: 'external',
        };
      }
    }
  } else {
    console.log('External DB credentials not configured, skipping external search');
  }

  // 3. Not found anywhere - create a local contact
  // Creating new contact for unmatched phone;

  // Get default user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  const defaultUserId = profiles?.[0]?.id || null;

  if (!defaultUserId) {
    console.error('No user found to create contact');
    return { contactId: null, userId: null, companyId: null, source: null };
  }

  const { data: newContact, error: createError } = await supabase
    .from('contacts')
    .insert({
      user_id: defaultUserId,
      first_name: 'WhatsApp',
      last_name: cleanPhone,
      whatsapp: cleanPhone,
      phone: cleanPhone,
      notes: `Contato criado automaticamente via WhatsApp (Evolution API)`,
      relationship_stage: 'unknown',
      sentiment: 'neutral',
    })
    .select('id, user_id, company_id')
    .single();

  if (createError) {
    console.error('Error creating contact:', createError.message);
    return { contactId: null, userId: defaultUserId, companyId: null, source: null };
  }

  // Created new contact: ${newContact.id}`);
  return {
    contactId: newContact.id,
    userId: defaultUserId,
    companyId: null,
    source: 'created',
  };
}

// ========================
// MESSAGES.UPSERT - New message received/sent
// ========================
async function handleMessageUpsert(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const phoneNumber = data.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
  const isFromMe = data.key?.fromMe;
  const senderName = data.pushName || 'Desconhecido';
  const messageId = data.key?.id;

  // Extract message content
  let messageContent = '';
  let messageType = 'text';

  if (data.message?.conversation) {
    messageContent = data.message.conversation;
  } else if (data.message?.extendedTextMessage?.text) {
    messageContent = data.message.extendedTextMessage.text;
  } else if (data.message?.imageMessage) {
    messageType = 'image';
    messageContent = data.message.imageMessage.caption || '[Imagem]';
  } else if (data.message?.videoMessage) {
    messageType = 'video';
    messageContent = data.message.videoMessage.caption || '[Vídeo]';
  } else if (data.message?.audioMessage) {
    messageType = 'audio';
    messageContent = '[Áudio]';
  } else if (data.message?.documentMessage) {
    messageType = 'document';
    messageContent = data.message.documentMessage.fileName || '[Documento]';
  } else if (data.message?.stickerMessage) {
    messageType = 'sticker';
    messageContent = '[Figurinha]';
  } else if (data.message?.locationMessage) {
    messageType = 'location';
    messageContent = `[Localização: ${data.message.locationMessage.degreesLatitude}, ${data.message.locationMessage.degreesLongitude}]`;
  } else if (data.message?.contactMessage) {
    messageType = 'contact';
    messageContent = `[Contato: ${data.message.contactMessage.displayName || ''}]`;
  } else if (data.message?.reactionMessage) {
    messageType = 'reaction';
    messageContent = data.message.reactionMessage.text || '';
  } else if (data.message?.pollCreationMessage) {
    messageType = 'poll';
    messageContent = data.message.pollCreationMessage.name || '[Enquete]';
  }

  // Skip if no content
  if (!messageContent && messageType === 'text') {
    return jsonResponse({ status: 'ignored', reason: 'no text content' });
  }

  // Map message status from Evolution
  let status = 'sent';
  if (data.status === 'DELIVERY_ACK') status = 'delivered';
  else if (data.status === 'READ') status = 'read';
  else if (data.status === 'PLAYED') status = 'played';
  else if (data.status === 'ERROR') status = 'error';
  else if (data.status === 'PENDING') status = 'pending';
  // SERVER_ACK mantém o valor inicial 'sent'

  // Find contact using enhanced search (local -> external -> create)
  const { contactId, userId, companyId, source } = await findContactByPhone(supabase, phoneNumber || '');

  // Enhanced automated ingestion: WhatsApp messages, company link and audio handling
  let dbMessageId = null;
  if (userId) {
    const messageData = {
      user_id: userId,
      contact_id: contactId,
      instance_name: instance,
      remote_jid: data.key.remoteJid,
      message_id: messageId,
      from_me: isFromMe,
      message_type: messageType,
      content: messageContent,
      status,
      sender_name: senderName,
      timestamp: data.messageTimestamp
        ? new Date(data.messageTimestamp * 1000).toISOString()
        : new Date().toISOString(),
      metadata: {
        messageType: data.messageType,
        participant: data.participant,
        instanceId: data.instanceId,
        contactSource: source,
        company_id: companyId, // Explicitly link to company
      },
    };

    const { data: upsertedMsg, error: msgError } = await supabase
      .from('whatsapp_messages')
      .upsert(messageData, { onConflict: 'message_id' })
      .select('id')
      .single();

    if (!msgError && upsertedMsg) {
       await supabase.from('whatsapp_ingestion_logs').insert({
        user_id: userId,
        contact_id: contactId,
        message_id: messageId,
        event_type: 'message',
        status: 'success',
        details: { dbMessageId: upsertedMsg.id, source, companyId }
      });
      dbMessageId = upsertedMsg.id;
    } else if (msgError) {
      console.error('Error upserting whatsapp_message:', msgError.message);
      // Retry for parallel edge cases
      const { data: fallbackMsg } = await supabase.from('whatsapp_messages').select('id').eq('message_id', messageId).single();
      if (fallbackMsg) dbMessageId = fallbackMsg.id;
    }

    // Automated transcription for voice messages/attachments
    if (messageType === 'audio' && dbMessageId) {
       await supabase.from('whatsapp_ingestion_logs').insert({
        user_id: userId,
        contact_id: contactId,
        message_id: messageId,
        event_type: 'transcription_init',
        status: 'pending',
        details: { dbMessageId }
      });

      // Invoke voice-to-text with auto-save to interaction
      supabase.functions.invoke('voice-to-text', {
        body: {
          whatsappMessageId: dbMessageId,
          userId,
          autoSave: true, // New flag for server-side persistence
          contactId,
          companyId
        },
      }).then(async ({ data: resp, error }) => {
        if (!error && resp?.success) {
          await supabase.from('whatsapp_ingestion_logs').insert({
            user_id: userId,
            contact_id: contactId,
            message_id: messageId,
            event_type: 'transcription_complete',
            status: 'success',
            details: { dbMessageId, transcription: resp.text, interactionId: resp.interactionId }
          });
          
          // Trigger analytical profile update after new data
          supabase.functions.invoke('social-behavior-analyzer', {
            body: { contactId, userId, companyId }
          }).catch(console.error);
        }
      }).catch(err => console.error('Transcription async error:', err));
    }
  }

  // Create interaction for text messages
  if (messageContent && contactId && userId && messageType === 'text') {
    // Update contact name if we created it and now have pushName
    if (source === 'created' && senderName && senderName !== 'Desconhecido') {
      await supabase
        .from('contacts')
        .update({ first_name: senderName, last_name: '' })
        .eq('id', contactId);
      // Updated contact name: ${senderName}`);
    }

    const interactionTitle = isFromMe 
      ? 'Mensagem Enviada (WhatsApp)' 
      : `Mensagem de ${senderName} (WhatsApp)`;

    const interactionData = {
      contact_id: contactId,
      company_id: companyId,
      user_id: userId,
      type: 'whatsapp',
      title: interactionTitle,
      content: messageContent,
      sentiment: 'neutral',
      initiated_by: isFromMe ? 'us' : 'them',
      follow_up_required: !isFromMe,
      tags: ['evolution-api', 'auto-imported'],
      created_at: data.messageTimestamp
        ? new Date(data.messageTimestamp * 1000).toISOString()
        : new Date().toISOString(),
    };

    const { data: interaction, error: interactionError } = await supabase
      .from('interactions')
      .insert(interactionData)
      .select()
      .single();

    if (interactionError) {
      console.error('Error creating interaction:', interactionError.message);
    } else {
      // Interaction created: ${interaction.id} (contact source: ${source})`);

      // Trigger DISC analysis for long messages
      if (messageContent.length >= 100 && contactId) {
        supabase.functions.invoke('disc-analyzer', {
          body: {
            texts: [messageContent],
            contactId,
            interactionId: interaction.id,
            userId,
          },
        }).catch((err: any) => console.error('DISC analyzer error:', err));
      }
    }
  }

  return jsonResponse({
    status: 'success',
    contactId,
    contactSource: source,
    messageType,
    analyzed: (messageContent?.length || 0) >= 100,
  });
}

// ========================
// MESSAGES.UPDATE - Message status update (delivered, read, etc.)
// ========================
async function handleMessageUpdate(supabase: any, payload: any, instance: string) {
  const { data } = payload;

  if (!data?.key?.id) {
    return jsonResponse({ status: 'ignored', reason: 'no message key' });
  }

  const updates: Record<string, any> = {};

  if (data.update?.status === 3 || data.update?.status === 'DELIVERY_ACK') {
    updates.status = 'delivered';
    updates.delivered_at = new Date().toISOString();
  } else if (data.update?.status === 4 || data.update?.status === 'READ') {
    updates.status = 'read';
    updates.read_at = new Date().toISOString();
  } else if (data.update?.status === 5 || data.update?.status === 'PLAYED') {
    updates.status = 'played';
    updates.played_at = new Date().toISOString();
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('whatsapp_messages')
      .update(updates)
      .eq('message_id', data.key.id);

    if (error) {
      console.error('Error updating message status:', error);
    }
  }

  return jsonResponse({ status: 'success', messageId: data.key.id, updates });
}

// ========================
// CONNECTION.UPDATE - Instance connection state changed
// ========================
async function handleConnectionUpdate(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const state = data?.state; // open, close, connecting

  // Instance ${instance} connection: ${state}`);

  const updates: Record<string, any> = {
    status: state === 'open' ? 'connected' : state === 'close' ? 'disconnected' : 'connecting',
    updated_at: new Date().toISOString(),
  };

  if (state === 'open') {
    updates.last_connected_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('whatsapp_instances')
    .update(updates)
    .eq('instance_name', instance);

  if (error) {
    console.error('Error updating instance status:', error);
  }

  return jsonResponse({ status: 'success', instance, state });
}

// ========================
// CONTACTS.UPSERT - WhatsApp contact synced
// ========================
async function handleContactsUpsert(supabase: any, payload: any, instance: string) {
  const { data } = payload;

  if (!data?.id) {
    return jsonResponse({ status: 'ignored', reason: 'no contact data' });
  }

  const phoneNumber = data.id?.replace('@s.whatsapp.net', '');
  const profileName = data.pushName || data.name;

  if (profileName && phoneNumber) {
    // Update existing contacts with WhatsApp profile info
    const { error } = await supabase
      .from('contacts')
      .update({
        avatar_url: data.profilePictureUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
      .not('avatar_url', 'is', null); // Only update if they don't already have a custom avatar

    if (error) {
      // Contact not found for presence update;
    }
  }

  return jsonResponse({ status: 'success', phone: phoneNumber });
}

// ========================
// PRESENCE.UPDATE - Online/offline/typing status
// ========================
async function handlePresenceUpdate(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  // Presence updates are ephemeral - we log but don't persist them heavily
  // Presence update: ${data?.id} -> ${JSON.stringify(data?.presences)}`);
  return jsonResponse({ status: 'logged', presenceId: data?.id });
}

// ========================
// CALL - Voice/video call received
// ========================
async function handleCall(supabase: any, payload: any, instance: string) {
  const { data } = payload;
  const phoneNumber = data?.from?.replace('@s.whatsapp.net', '');

  console.log(`Call from ${phoneNumber}, isVideo: ${data?.isVideo}`);

  // Find contact using enhanced search
  if (phoneNumber) {
    const { contactId, userId, companyId } = await findContactByPhone(supabase, phoneNumber);

    if (contactId && userId) {
      await supabase.from('interactions').insert({
        contact_id: contactId,
        company_id: companyId,
        user_id: userId,
        type: 'call',
        title: `Chamada ${data?.isVideo ? 'de Vídeo' : 'de Voz'} (WhatsApp)`,
        content: `Chamada ${data?.isVideo ? 'de vídeo' : 'de voz'} recebida via WhatsApp. Status: ${data?.status || 'recebida'}`,
        sentiment: 'neutral',
        initiated_by: 'them',
        tags: ['evolution-api', 'auto-imported', data?.isVideo ? 'video-call' : 'voice-call'],
      });
    }
  }

  return jsonResponse({ status: 'success', from: phoneNumber });
}

// ========================
// SEND.MESSAGE - Outgoing message confirmation
// ========================
async function handleSendMessage(supabase: any, payload: any, instance: string) {
  const { data } = payload;

  if (data?.key?.id) {
    await supabase
      .from('whatsapp_messages')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('message_id', data.key.id);
  }

  return jsonResponse({ status: 'success' });
}