import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonError, jsonOk } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 1. Fetch all users to check reminders for
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, phone');

    if (usersError) throw usersError;

    const stats = { usersProcessed: 0, notificationsSent: 0 };

    for (const user of users) {
      stats.usersProcessed++;
      
      // Get high priority pending Next Best Actions
      const { data: actions } = await supabaseClient
        .from('contact_next_actions')
        .select(`
          id, action, urgency, contact_id,
          contacts:contact_id (first_name, last_name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .eq('urgency', 'high')
        .limit(5);

      if (actions && actions.length > 0) {
        for (const action of actions) {
          const reminderId = `nba-notify-${action.id}`;
          
          // Check if already notified
          const { data: existing } = await supabaseClient
            .from('notification_logs')
            .select('id')
            .eq('reminder_id', reminderId)
            .maybeSingle();

          if (existing) continue;

          // Send WhatsApp if user has a phone
          if (user.phone) {
            const contactData = Array.isArray(action.contacts) ? action.contacts[0] : action.contacts;
            const contactName = contactData ? `${(contactData as any).first_name} ${(contactData as any).last_name}` : 'Contato';
            
            const message = `🎯 *Lembrete de Ação Prioritária*\n\nOlá ${user.first_name}, você tem uma ação pendente com *${contactName}*:\n\n👉 *${action.action}*\n\nUrgência: Alta 🚨\n\nAcesse o CRM para concluir!`;

            try {
              const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
              const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
              
              if (evolutionUrl && evolutionKey) {
                const baseUrl = evolutionUrl.replace(/\/$/, '');
                const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'main';

                const resp = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': evolutionKey,
                  },
                  body: JSON.stringify({
                    number: user.phone.replace(/\D/g, ''),
                    text: message,
                  }),
                });

                if (resp.ok) {
                  // Log success
                  await supabaseClient.from('notification_logs').insert({
                    reminder_id: reminderId,
                    contact_id: action.contact_id,
                    user_id: user.id,
                    channel: 'whatsapp'
                  });
                  stats.notificationsSent++;
                }
              }
            } catch (err) {
              console.error(`Error sending WhatsApp to ${user.id}:`, err);
            }
          }
        }
      }
    }

    return jsonOk({ success: true, stats });

  } catch (error: unknown) {
    console.error('Smart Notify Error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unknown error', 500);
  }
});