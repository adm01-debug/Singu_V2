import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  requireCronSecret,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

interface AlertData {
  type: 'birthday' | 'renewal' | 'at_risk' | 'health_alert' | 'life_event';
  title: string;
  body: string;
  url?: string;
  contactId?: string;
  userId: string;
}

async function sendPushToUser(supabase: any, userId: string, alert: AlertData, log: any, traceId: string) {
  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (subError) {
    log.error('fetch_subscriptions_failed', { userId, error: subError.message });
    return { sent: 0 };
  }

  if (!subscriptions?.length) {
    log.info(`no_push_subscriptions`, { userId });
    return { sent: 0 };
  }

  let sentCount = 0;

  for (const _sub of subscriptions) {
    try {
      const { error: insertError } = await supabase.from('alerts').insert({
        user_id: userId,
        title: alert.title,
        description: alert.body,
        type: alert.type,
        contact_id: alert.contactId || null,
        action_url: alert.url || null,
        priority: alert.type === 'at_risk' || alert.type === 'health_alert' ? 'high' : 'medium',
      });

      if (insertError) {
        log.error('alert_insert_failed', { userId, error: insertError.message });
      } else {
        sentCount++;
      }
    } catch (error) {
      log.error('alert_insert_threw', { userId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { sent: sentCount };
}

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "client-notifications");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Cron secret validation
  const cronError = requireCronSecret(req);
  if (cronError) {
    log.warn("unauthorized_cron_access");
    return cronError;
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log.info('check_started');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const alertsSent: AlertData[] = [];

    // Get all distinct user_ids from contacts
    const { data: allContacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, birthday, relationship_score, user_id')
      .not('birthday', 'is', null);

    if (contactError) {
      log.error('fetch_all_contacts_failed', { error: contactError.message });
      throw contactError;
    }

    // Group contacts by user_id
    const userContactsMap = new Map<string, typeof allContacts>();
    for (const contact of allContacts || []) {
      const existing = userContactsMap.get(contact.user_id) || [];
      existing.push(contact);
      userContactsMap.set(contact.user_id, existing);
    }

    log.info('users_to_process', { count: userContactsMap.size });

    for (const [userId, contacts] of userContactsMap) {
      // 1. Check for birthdays
      for (const contact of (contacts || [])) {
        if (!contact.birthday) continue;

        const birthday = new Date(contact.birthday);
        const thisYearBday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (thisYearBday < today) {
          thisYearBday.setFullYear(today.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil === 0) {
          const alert: AlertData = {
            type: 'birthday',
            title: `🎂 Aniversário Hoje!`,
            body: `${contact.first_name} ${contact.last_name} faz aniversário hoje!`,
            url: `/contatos/${contact.id}`,
            contactId: contact.id,
            userId,
          };
          await sendPushToUser(supabase, userId, alert, log, traceId);
          alertsSent.push(alert);
        } else if (daysUntil === 7) {
          const alert: AlertData = {
            type: 'birthday',
            title: `🎂 Aniversário em 7 dias`,
            body: `${contact.first_name} ${contact.last_name} fará aniversário em uma semana`,
            url: `/contatos/${contact.id}`,
            contactId: contact.id,
            userId,
          };
          await sendPushToUser(supabase, userId, alert, log, traceId);
          alertsSent.push(alert);
        }
      }

      // 2. Check for upcoming renewals
      const { data: renewals } = await supabase
        .from('purchase_history')
        .select(`
          id, product_name, renewal_date, contact_id,
          contacts!inner (first_name, last_name)
        `)
        .eq('user_id', userId)
        .not('renewal_date', 'is', null)
        .gte('renewal_date', today.toISOString())
        .lte('renewal_date', sevenDaysFromNow.toISOString());

      for (const renewal of renewals || []) {
        const contact = renewal.contacts as unknown as { first_name: string; last_name: string };
        const renewalDate = new Date(renewal.renewal_date!);
        const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 7) {
          const alert: AlertData = {
            type: 'renewal',
            title: `🔄 Renovação em ${daysUntil} dia(s)`,
            body: `${renewal.product_name} de ${contact.first_name} ${contact.last_name}`,
            url: `/contatos/${renewal.contact_id}`,
            contactId: renewal.contact_id,
            userId,
          };
          await sendPushToUser(supabase, userId, alert, log, traceId);
          alertsSent.push(alert);
        }
      }

      // 3. Check for at-risk contacts (no contact in 30+ days, high score)
      const { data: recentInteractions } = await supabase
        .from('interactions')
        .select('contact_id')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const recentContactIds = new Set((recentInteractions || []).map(i => i.contact_id));

      const { data: highValueContacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, relationship_score')
        .eq('user_id', userId)
        .gte('relationship_score', 60);

      for (const contact of highValueContacts || []) {
        if (!recentContactIds.has(contact.id)) {
          const { data: recentAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('user_id', userId)
            .eq('contact_id', contact.id)
            .eq('type', 'at_risk')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!recentAlert?.length) {
            const alert: AlertData = {
              type: 'at_risk',
              title: `⚠️ Cliente em Risco`,
              body: `${contact.first_name} ${contact.last_name} está há mais de 30 dias sem contato`,
              url: `/contatos/${contact.id}`,
              contactId: contact.id,
              userId,
            };
            await sendPushToUser(supabase, userId, alert, log, traceId);
            alertsSent.push(alert);
          }
        }
      }

       // 4. Check for upcoming life events (including recurring ones)
       const { data: lifeEvents } = await supabase
         .from('life_events')
         .select(`
           id, title, event_date, event_type, reminder_days_before, last_reminded_at, contact_id, recurring,
           contacts!inner (first_name, last_name)
         `)
         .eq('user_id', userId);

       for (const event of lifeEvents || []) {
         const contact = event.contacts as unknown as { first_name: string; last_name: string };
         let eventDate = new Date(event.event_date);
         
         // Handle recurring events by adjusting the year
         if (event.recurring) {
           const nextOccurrence = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
           if (nextOccurrence < today) {
             nextOccurrence.setFullYear(today.getFullYear() + 1);
           }
           eventDate = nextOccurrence;
         }

         const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
         const reminderDays = event.reminder_days_before || 7;

         // Only notify if the date is within the reminder window and is in the future or today
         if (daysUntil >= 0 && daysUntil <= reminderDays) {
           if (event.last_reminded_at) {
             const lastReminded = new Date(event.last_reminded_at);
             const daysSinceReminder = (today.getTime() - lastReminded.getTime()) / (1000 * 60 * 60 * 24);
             if (daysSinceReminder < 1) continue;
           }

           const alert: AlertData = {
             type: 'life_event',
             title: daysUntil === 0 ? `📅 Evento Hoje!` : `📅 Evento em ${daysUntil} dia(s)`,
             body: `${event.title} - ${contact.first_name} ${contact.last_name}`,
             url: `/contatos/${event.contact_id}`,
             contactId: event.contact_id,
             userId,
           };
           await sendPushToUser(supabase, userId, alert, log, traceId);
           alertsSent.push(alert);

           await supabase
             .from('life_events')
             .update({ last_reminded_at: now.toISOString() })
             .eq('id', event.id);
         }
       }
    }

    log.info('check_complete', { alertsSent: alertsSent.length });

    return jsonOk({ 
      success: true, 
      notificationsSent: alertsSent.length,
      notifications: alertsSent.map(a => ({ type: a.type, title: a.title })),
      traceId
    }, req);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log.error("fatal_error", { error: msg });
    return jsonError(msg, 500, req);
  }
});
