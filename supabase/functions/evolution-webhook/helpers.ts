import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type SupabaseAdminClient = SupabaseClient;

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function resolveInstanceOwner(supabase: SupabaseAdminClient, instance: string): Promise<string | null> {
  const { data, error } = await supabase.from('whatsapp_instances')
    .select('user_id').eq('instance_name', instance).limit(2);
  if (error) throw new Error('Não foi possível confirmar o proprietário da instância');
  return data?.length === 1 && data[0].user_id ? data[0].user_id : null;
}

// Busca contato pelo telefone: primeiro no banco local, depois no externo
export async function findContactByPhone(supabase: SupabaseAdminClient, phoneNumber: string, userId: string): Promise<{
  contactId: string | null;
  userId: string | null;
  companyId: string | null;
  source: 'local' | 'external' | 'created' | null;
}> {
  // Normaliza o telefone removendo caracteres não numéricos
  const cleanPhone = phoneNumber.replace(/\D/g, '');

  // Testa diferentes formatos de telefone
  const phoneVariants = [cleanPhone];
  // Para números iniciados em 55 (Brasil), tenta também sem o código do país
  if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
    phoneVariants.push(cleanPhone.substring(2));
  }
  // Para os demais, tenta também com o código do país
  if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
    phoneVariants.push('55' + cleanPhone);
  }

  // 1. Busca contatos LOCAIS numa consulta com todas as variantes via OR
  const localOrFilter = phoneVariants.map(v => `whatsapp.eq.${v},phone.eq.${v}`).join(',');
  const { data: localContacts, error: localError } = await supabase
    .from('contacts')
    .select('id, user_id, company_id')
    .eq('user_id', userId)
    .or(localOrFilter)
    .limit(1);
  if (localError) throw new Error('Não foi possível consultar os contatos locais');

  if (localContacts && localContacts.length > 0) {
    return {
      contactId: localContacts[0].id,
      userId,
      companyId: localContacts[0].company_id,
      source: 'local',
    };
  }

  // 2. Busca no banco EXTERNO de contatos
  const externalUrl = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const externalKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');

  if (externalUrl && externalKey) {
    const externalSupabase = createClient(externalUrl, externalKey);

    // Consulta única com todas as variantes via OR
    const extOrFilter = phoneVariants.map(v => `whatsapp.eq.${v},phone.eq.${v}`).join(',');
    const { data: extContacts, error: extError } = await externalSupabase
      .from('contacts')
      .select('id, company_id, first_name, last_name, cargo, whatsapp, phone')
      .eq('user_id', userId)
      .or(extOrFilter)
      .limit(1);

    if (extError) {
      throw new Error('Não foi possível consultar os contatos externos');
    } else if (extContacts && extContacts.length > 0) {
      const extContact = extContacts[0];

      return {
        contactId: extContact.id,
        userId,
        companyId: extContact.company_id,
        source: 'external',
      };
    }
  } else {
    console.log('External DB credentials not configured, skipping external search');
  }

  // 3. Se não houver correspondência, cria contato local
  // Criação de contato para telefone sem correspondência;

  const { data: newContact, error: createError } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
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
    throw new Error('Não foi possível criar o contato');
  }

  // Novo contato criado: ${newContact.id}`);
  return {
    contactId: newContact.id,
    userId,
    companyId: null,
    source: 'created',
  };
}
