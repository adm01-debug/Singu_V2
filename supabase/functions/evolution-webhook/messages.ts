import { bestEffortWrite } from "../_shared/best-effort-write.ts";
import { jsonResponse, findContactByPhone, type SupabaseAdminClient } from "./helpers.ts";
import { readEventData, requireMessageData, requireMessageKey, messageUpdateData, sendMessageData } from "./payload.ts";

// ========================
// MESSAGES.UPSERT - Nova mensagem recebida/enviada
// ========================
export async function handleMessageUpsert(supabase: SupabaseAdminClient, payload: unknown, instance: string) {
  const data = requireMessageData(payload);
  const phoneNumber = data.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '');
  const isFromMe = data.key?.fromMe;
  const senderName = data.pushName || 'Desconhecido';
  const messageId = data.key?.id;

  // Extrai o conteúdo da mensagem
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

  // Limita o conteúdo para evitar abuso (whatsapp_messages.content é TEXT)
  messageContent = messageContent.slice(0, 100_000);

  // Ignora mensagens sem conteúdo
  if (!messageContent && messageType === 'text') {
    return jsonResponse({ status: 'ignored', reason: 'no text content' });
  }

  // Mapeia o status da mensagem recebido da Evolution
  let status = 'sent';
  if (data.status === 'DELIVERY_ACK') status = 'delivered';
  else if (data.status === 'READ') status = 'read';
  else if (data.status === 'PLAYED') status = 'played';
  else if (data.status === 'ERROR') status = 'error';
  else if (data.status === 'PENDING') status = 'pending';
  // SERVER_ACK mantém o valor inicial 'sent'

  // Busca contato local, depois externo; cria se necessário
  const { contactId, userId, companyId, source } = await findContactByPhone(supabase, phoneNumber || '', instance);

  // Ingestão de mensagens, vínculo com empresa e tratamento de áudio
  let dbMessageId: string | null = null;
  if (userId) {
    const messageData = {
      user_id: userId,
      contact_id: contactId,
      instance_name: instance,
      remote_jid: requireMessageKey(data).remoteJid,
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
        company_id: companyId, // Vincula explicitamente à empresa
      },
    };

    const { data: upsertedMsg, error: msgError } = await supabase
      .from('whatsapp_messages')
      .upsert(messageData, { onConflict: 'message_id' })
      .select('id')
      .single();

    if (!msgError && upsertedMsg) {
      await bestEffortWrite(supabase.from('whatsapp_ingestion_logs').insert({
        user_id: userId,
        contact_id: contactId,
        message_id: messageId,
        event_type: 'message',
        status: 'success',
        details: { dbMessageId: upsertedMsg.id, source, companyId }
      }), 'ingestion_log insert error:');
      dbMessageId = upsertedMsg.id;
    } else if (msgError) {
      console.error('Error upserting whatsapp_message:', msgError.message);
      // Recupera a mensagem criada em paralelo
      const { data: fallbackMsg } = await supabase.from('whatsapp_messages').select('id').eq('message_id', messageId).single();
      if (fallbackMsg) dbMessageId = fallbackMsg.id;
    }

    // Transcrição automática de áudio e anexos de voz
    if (messageType === 'audio' && dbMessageId) {
      await bestEffortWrite(supabase.from('whatsapp_ingestion_logs').insert({
        user_id: userId,
        contact_id: contactId,
        message_id: messageId,
        event_type: 'transcription_init',
        status: 'pending',
        details: { dbMessageId }
      }), 'ingestion_log transcription_init error:');

      // Chama voice-to-text com gravação automática da interação
      supabase.functions.invoke('voice-to-text', {
        body: {
          whatsappMessageId: dbMessageId,
          userId,
          autoSave: true, // Gravação pelo servidor
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

          // Atualiza o perfil analítico após os novos dados
          supabase.functions.invoke('social-behavior-analyzer', {
            body: { contactId, userId, companyId }
          }).catch(console.error);
        }
      }).catch(err => console.error('Transcription async error:', err));
    }
  }

  // Cria interação para mensagens de texto
  if (messageContent && contactId && userId && messageType === 'text') {
    // Atualiza o nome do contato recém-criado quando há pushName
    if (source === 'created' && senderName && senderName !== 'Desconhecido') {
      await bestEffortWrite(supabase
        .from('contacts')
        .update({ first_name: senderName, last_name: '' })
        .eq('id', contactId), 'contact name update error:');
    }

    const safeSenderName = senderName ? String(senderName).slice(0, 200) : 'Desconhecido';
    const interactionTitle = isFromMe
      ? 'Mensagem Enviada (WhatsApp)'
      : `Mensagem de ${safeSenderName} (WhatsApp)`;

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
      // Interação criada: ${interaction.id} (origem do contato: ${source})`);

      // Aciona análise DISC para mensagens longas (contactId existe neste bloco)
      if (messageContent.length >= 100) {
        supabase.functions.invoke('disc-analyzer', {
          body: {
            texts: [messageContent],
            contactId,
            interactionId: interaction.id,
            userId,
          },
        }).catch((err: unknown) => console.error('DISC analyzer error:', err));
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
// MESSAGES.UPDATE - Atualização do status da mensagem (entregue, lida etc.)
// ========================
export async function handleMessageUpdate(supabase: SupabaseAdminClient, payload: unknown, instance: string) {
  const data = readEventData(payload, messageUpdateData);

  if (!data?.key?.id) {
    return jsonResponse({ status: 'ignored', reason: 'no message key' });
  }

  const updates: Record<string, unknown> = {};

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
// SEND.MESSAGE - Confirmação da mensagem enviada
// ========================
export async function handleSendMessage(supabase: SupabaseAdminClient, payload: unknown, instance: string) {
  const data = readEventData(payload, sendMessageData);

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
