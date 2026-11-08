import { jsonResponse, findContactByPhone, type SupabaseAdminClient } from "./helpers.ts";
import { readEventData, connectionUpdateData, contactsUpsertData, presenceUpdateData, callData } from "./payload.ts";

// ========================
// CONNECTION.UPDATE - Mudança de estado da conexão da instância
// ========================
export async function handleConnectionUpdate(supabase: SupabaseAdminClient, payload: unknown, instance: string) {
  const data = readEventData(payload, connectionUpdateData);
  const state = data?.state; // Aberta, fechada ou conectando

  // Conexão da instância ${instance}: ${state}`);

  const updates: Record<string, unknown> = {
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
// CONTACTS.UPSERT - Contato do WhatsApp sincronizado
// ========================
export async function handleContactsUpsert(supabase: SupabaseAdminClient, payload: unknown, instance: string) {
  const data = readEventData(payload, contactsUpsertData);

  if (!data?.id) {
    return jsonResponse({ status: 'ignored', reason: 'no contact data' });
  }

  const phoneNumber = data.id?.replace('@s.whatsapp.net', '');
  const profileName = data.pushName || data.name;

  if (profileName && phoneNumber) {
    // Atualiza contatos existentes com dados do perfil do WhatsApp
    const { error } = await supabase
      .from('contacts')
      .update({
        avatar_url: data.profilePictureUrl || undefined,
        updated_at: new Date().toISOString(),
      })
      .or(`whatsapp.eq.${phoneNumber},phone.eq.${phoneNumber}`)
      .not('avatar_url', 'is', null); // Atualiza somente contatos sem avatar personalizado

    if (error) {
      // Contato não encontrado para atualização da presença;
    }
  }

  return jsonResponse({ status: 'success', phone: phoneNumber });
}

// ========================
// PRESENCE.UPDATE - Estado online/offline/digitando
// ========================
export async function handlePresenceUpdate(supabase: SupabaseAdminClient, payload: unknown, instance: string) {
  const data = readEventData(payload, presenceUpdateData);
  // Atualizações de presença são efêmeras; não persistimos seus detalhes
  // Atualização de presença: ${data?.id} -> ${JSON.stringify(data?.presences)}`);
  return jsonResponse({ status: 'logged', presenceId: data?.id });
}

// ========================
// CALL - Chamada de voz/vídeo recebida
// ========================
export async function handleCall(supabase: SupabaseAdminClient, payload: unknown, instance: string) {
  const data = readEventData(payload, callData);
  const phoneNumber = data?.from?.replace('@s.whatsapp.net', '');

  console.log(`Call from ${phoneNumber}, isVideo: ${data?.isVideo}`);

  // Busca o contato
  if (phoneNumber) {
    const { contactId, userId, companyId } = await findContactByPhone(supabase, phoneNumber, instance);

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
