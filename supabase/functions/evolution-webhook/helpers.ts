import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type SupabaseAdminClient = SupabaseClient;

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Busca contato pelo telefone: primeiro no banco local, depois no externo
export async function findContactByPhone(supabase: SupabaseAdminClient, phoneNumber: string, instance: string): Promise<{
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
  const { data: localContacts } = await supabase
    .from('contacts')
    .select('id, user_id, company_id')
    .or(localOrFilter)
    .limit(1);

  if (localContacts && localContacts.length > 0) {
    return {
      contactId: localContacts[0].id,
      userId: localContacts[0].user_id,
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
      .or(extOrFilter)
      .limit(1);

    if (extError) {
      console.error('Error searching external contacts:', extError.message);
    } else if (extContacts && extContacts.length > 0) {
      const extContact = extContacts[0];

      // Primeiro tenta encontrar o usuário associado à instância
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('user_id')
        .eq('instance_name', instance)
        .maybeSingle();

      let defaultUserId = instanceData?.user_id;

      if (!defaultUserId) {
        // Em último caso, usa o primeiro usuário de profiles
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
  } else {
    console.log('External DB credentials not configured, skipping external search');
  }

  // 3. Se não houver correspondência, cria contato local
  // Criação de contato para telefone sem correspondência;

  // Busca o usuário padrão
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

  // Novo contato criado: ${newContact.id}`);
  return {
    contactId: newContact.id,
    userId: defaultUserId,
    companyId: null,
    source: 'created',
  };
}
