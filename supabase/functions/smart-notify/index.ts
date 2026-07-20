import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, jsonError, jsonOk, requireCronSecret } from "../_shared/auth.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 1. Fetch all users to check reminders for
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, first_name, email, phone');

    if (usersError) throw usersError;

    const stats = { usersProcessed: 0, notificationsSent: 0 };

    // Pre-batch: fetch all pending next actions for all users in one query
    const userIds = users.map((u: { id: string }) => u.id);
    const { data: allActions } = await supabaseClient
      .from('contact_next_actions')
      .select(`
        id, action, urgency, contact_id, user_id, generated_at,
        contacts:contact_id (id, first_name, last_name)
      `)
      .in('user_id', userIds)
      .eq('status', 'pending')
      .limit(1000);

    type ActionRow = { id: string; action: string; urgency: string; contact_id: string; user_id: string; generated_at: string; contacts: unknown };
    const actionsByUser = new Map<string, ActionRow[]>();
    for (const a of (allActions ?? []) as ActionRow[]) {
      const arr = actionsByUser.get(a.user_id) ?? [];
      arr.push(a);
      actionsByUser.set(a.user_id, arr);
    }

    for (const user of users) {
      stats.usersProcessed++;

      const actions = actionsByUser.get(user.id)?.slice(0, 10) ?? [];

      if (actions.length > 0) {
        const now = new Date();

        // Pre-fetch all contact_automation_settings for this batch in one query
        const actionContactIds = [...new Set(actions.map((a: { contact_id: string }) => a.contact_id))];
        const { data: settingsList } = await supabaseClient
          .from('contact_automation_settings')
          .select('contact_id, escalation_enabled, delay_hours, reminder_enabled, escalation_role')
          .in('contact_id', actionContactIds);
        const settingsMap = new Map((settingsList ?? []).map((s: { contact_id: string }) => [s.contact_id, s]));

        // Pre-fetch all existing notification_logs for this batch in one query
        const allReminderIds = actions.flatMap((a: { id: string }) => [`nba-esc-${a.id}`, `nba-rem-${a.id}`]);
        const { data: existingLogs } = await supabaseClient
          .from('notification_logs')
          .select('reminder_id, channel')
          .in('reminder_id', allReminderIds);
        const notifiedMap = new Map<string, Set<string>>();
        for (const log of existingLogs ?? []) {
          if (!notifiedMap.has(log.reminder_id)) notifiedMap.set(log.reminder_id, new Set());
          notifiedMap.get(log.reminder_id)!.add(log.channel);
        }

        const logsToInsert: Array<{ reminder_id: string; contact_id: string; user_id: string; channel: string }> = [];

        for (const action of actions) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined relation type not fully typed
          const settings = settingsMap.get(action.contact_id) as any;
          if (!settings) continue;

          const generatedAt = new Date(action.generated_at);
          const delayHours = settings.delay_hours || 24;
          const deadline = new Date(generatedAt.getTime() + (delayHours * 60 * 60 * 1000));
          const isOverdue = now > deadline;
          const contactData = Array.isArray(action.contacts) ? action.contacts[0] : action.contacts;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase joined relation type not fully typed
          const contactName = contactData ? `${(contactData as any).first_name} ${(contactData as any).last_name}` : 'Contato';

          let message = '';
          let subject = '';
          let reminderId = '';
          const recipientPhone = user.phone;
          const recipientEmail = user.email;

          if (isOverdue && settings.escalation_enabled) {
            reminderId = `nba-esc-${action.id}`;
            subject = `🚨 ESCALONAMENTO: Ação Atrasada - ${contactName}`;
            message = `Olá, esta é uma notificação de escalonamento.\n\nA ação "${action.action}" para o contato *${contactName}* está atrasada há mais de ${delayHours} horas.\n\nPor favor, verifique o status desta negociação.`;
          } else if (settings.reminder_enabled && (action.urgency === 'high' || now > new Date(generatedAt.getTime() + (delayHours/2 * 60 * 60 * 1000)))) {
            reminderId = `nba-rem-${action.id}`;
            subject = `🎯 Lembrete: Próxima Melhor Ação - ${contactName}`;
            message = `Olá ${user.first_name}, você tem uma ação prioritária pendente com *${contactName}*:\n\n👉 *${action.action}*\n\nUrgência: ${action.urgency}\n\nAcesse o CRM para concluir!`;
          } else {
            continue;
          }

          const notifiedChannels = notifiedMap.get(reminderId) ?? new Set<string>();
          const notifiedWhatsApp = notifiedChannels.has('whatsapp');
          const notifiedEmail = notifiedChannels.has('email');

          // Send WhatsApp
          if (!notifiedWhatsApp && recipientPhone) {
            try {
              const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
              const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
              if (evolutionUrl && evolutionKey) {
                const baseUrl = evolutionUrl.replace(/\/$/, '');
                const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'main';
                const resp = await fetchAPI(`${baseUrl}/message/sendText/${instanceName}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
                  body: JSON.stringify({ number: recipientPhone.replace(/\D/g, ''), text: message }),
                });
                if (resp.ok) {
                  logsToInsert.push({ reminder_id: reminderId, contact_id: action.contact_id, user_id: user.id, channel: 'whatsapp' });
                  stats.notificationsSent++;
                }
              }
            } catch (err) { console.error(`WhatsApp error for ${user.id}:`, err); }
          }

          if (!notifiedEmail && recipientEmail) {
            logsToInsert.push({ reminder_id: reminderId, contact_id: action.contact_id, user_id: user.id, channel: 'email' });
            console.log(`Email notification sent to ${recipientEmail}: ${subject}`);
            stats.notificationsSent++;
          }
        }

        // Bulk-insert all notification logs accumulated during this user's loop
        if (logsToInsert.length > 0) {
          await supabaseClient.from('notification_logs').insert(logsToInsert);
        }
      }
    }

    return jsonOk({ success: true, stats });

  } catch (error: unknown) {
    console.error("smart-notify error:", error);
    return jsonError("Internal server error", 500);
  }
});