import { createClient } from "npm:@supabase/supabase-js@2";
import { sendTrackedNotification } from "../_shared/notification-delivery.ts";
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

    const stats = { usersProcessed: 0, notificationsSent: 0, notificationsFailed: 0, notificationsPending: 0 };

    // Pre-batch: fetch all pending next actions for all users in one query
    const userIds = users.map((u: { id: string }) => u.id);
    const { data: allActions, error: actionsError } = await supabaseClient
      .from('contact_next_actions')
      .select(`
        id, action, urgency, contact_id, user_id, generated_at,
        contacts:contact_id (id, first_name, last_name)
      `)
      .in('user_id', userIds)
      .eq('status', 'pending')
      .limit(1000);
    if (actionsError) throw actionsError;

    type ActionRow = { id: string; action: string; urgency: string; contact_id: string; user_id: string; generated_at: string; contacts: unknown };
    const allActionRows = (allActions ?? []) as ActionRow[];
    const actionsByUser = new Map<string, ActionRow[]>();
    for (const a of allActionRows) {
      const arr = actionsByUser.get(a.user_id) ?? [];
      arr.push(a);
      actionsByUser.set(a.user_id, arr);
    }

    // Pre-batch: fetch ALL contact_automation_settings and notification_logs up-front
    const allContactIds = [...new Set(allActionRows.map((a) => a.contact_id))];
    const allReminderIdsGlobal = allActionRows.flatMap((a) => [`nba-esc-${a.id}`, `nba-rem-${a.id}`]);
    const [settingsResult, logsResult] = await Promise.all([
      allContactIds.length > 0
        ? supabaseClient.from('contact_automation_settings')
            .select('contact_id, escalation_enabled, delay_hours, reminder_enabled, escalation_role')
            .in('contact_id', allContactIds)
        : Promise.resolve({ data: [], error: null }),
      allReminderIdsGlobal.length > 0
        ? supabaseClient.from('notification_logs')
            .select('reminder_id, channel, delivery_status')
            .in('reminder_id', allReminderIdsGlobal)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (settingsResult.error) throw settingsResult.error;
    if (logsResult.error) throw logsResult.error;
    const globalSettingsMap = new Map(
      ((settingsResult as { data: Array<{ contact_id: string }> }).data ?? []).map((s) => [s.contact_id, s])
    );
    const globalNotifiedMap = new Map<string, Map<string, string>>();
    for (const log of (logsResult as { data: Array<{ reminder_id: string; channel: string; delivery_status: string }> }).data ?? []) {
      if (!globalNotifiedMap.has(log.reminder_id)) globalNotifiedMap.set(log.reminder_id, new Map());
      globalNotifiedMap.get(log.reminder_id)!.set(log.channel, log.delivery_status);
    }

    for (const user of users) {
      stats.usersProcessed++;

      const actions = actionsByUser.get(user.id)?.slice(0, 10) ?? [];

      if (actions.length > 0) {
        const now = new Date();
        const settingsMap = globalSettingsMap;
        const notifiedMap = globalNotifiedMap;

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
          let reminderId = '';
          const recipientPhone = user.phone;

          if (isOverdue && settings.escalation_enabled) {
            reminderId = `nba-esc-${action.id}`;
            message = `Olá, esta é uma notificação de escalonamento.\n\nA ação "${action.action}" para o contato *${contactName}* está atrasada há mais de ${delayHours} horas.\n\nPor favor, verifique o status desta negociação.`;
          } else if (settings.reminder_enabled && (action.urgency === 'high' || now > new Date(generatedAt.getTime() + (delayHours/2 * 60 * 60 * 1000)))) {
            reminderId = `nba-rem-${action.id}`;
            message = `Olá ${user.first_name}, você tem uma ação prioritária pendente com *${contactName}*:\n\n👉 *${action.action}*\n\nUrgência: ${action.urgency}\n\nAcesse o CRM para concluir!`;
          } else {
            continue;
          }

          const notifiedChannels = notifiedMap.get(reminderId) ?? new Map<string, string>();
          const whatsappStatus = notifiedChannels.get('whatsapp');
          const notifiedWhatsApp = whatsappStatus !== undefined;
          if (whatsappStatus === 'pending') {
            stats.notificationsPending++;
            continue;
          }
          if (notifiedWhatsApp && whatsappStatus !== 'sent') {
            stats.notificationsFailed++;
            continue;
          }

          // Send WhatsApp
          if (!notifiedWhatsApp && recipientPhone) {
            try {
              const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
              const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
              if (evolutionUrl && evolutionKey) {
                const providerUrl = new URL(evolutionUrl);
                if (!['http:', 'https:'].includes(providerUrl.protocol) || providerUrl.username || providerUrl.password || providerUrl.search || providerUrl.hash) {
                  throw new Error('Configuração de URL do WhatsApp inválida');
                }
                const baseUrl = evolutionUrl.replace(/\/$/, '');
                const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'main';
                const delivery = await sendTrackedNotification(supabaseClient, {
                  reminder_id: reminderId, contact_id: action.contact_id, user_id: user.id, channel: 'whatsapp',
                }, () => fetchAPI(`${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
                  body: JSON.stringify({ number: recipientPhone.replace(/\D/g, ''), text: message }),
                }));
                if (delivery === 'sent') {
                  stats.notificationsSent++;
                } else {
                  const { data: existing, error: existingError } = await supabaseClient.from('notification_logs')
                    .select('delivery_status').eq('reminder_id', reminderId).eq('channel', 'whatsapp')
                    .eq('user_id', user.id).maybeSingle();
                  if (existingError) throw existingError;
                  if (existing?.delivery_status === 'pending') stats.notificationsPending++;
                  else if (existing?.delivery_status !== 'sent') throw new Error('A entrega existente não foi confirmada');
                }
              } else {
                throw new Error('WhatsApp não configurado');
              }
            } catch (err) {
              stats.notificationsFailed++;
              console.error(`WhatsApp error for ${user.id}:`, err);
            }
          }
        }
      }
    }

    if (stats.notificationsFailed > 0) return jsonError('Não foi possível concluir as entregas. As reservas existentes impedem a repetição automática.', 502, req);
    if (stats.notificationsPending > 0) return new Response(JSON.stringify({ success: false, status: 'processing', stats }), {
      status: 202, headers: { ...cors, 'Content-Type': 'application/json' },
    });

    return jsonOk({ success: true, stats }, req);

  } catch (error: unknown) {
    console.error("smart-notify error:", error);
    return jsonError("Internal server error", 500, req);
  }
});