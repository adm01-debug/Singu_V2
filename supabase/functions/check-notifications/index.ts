import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret, jsonError, jsonOk } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "check-notifications");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // 🔒 Cron secret validation
  const cronError = await requireCronSecret(req);
  if (cronError) {
    log.warn("unauthorized_cron_access");
    return cronError;
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    log.info("check_started");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const notifications: Array<{
      userId: string;
      title: string;
      body: string;
      data: Record<string, unknown>;
      tag: string;
    }> = [];

    // Check for today's follow-ups
    const { data: followUps, error: followUpError } = await supabaseClient
      .from('interactions')
      .select(`
        id,
        title,
        follow_up_date,
        contact_id,
        user_id,
        contacts:contact_id (first_name, last_name)
      `)
      .eq('follow_up_required', true)
      .eq('follow_up_date', todayStr);

    if (followUpError) {
      log.error('fetch_followups_failed', { error: followUpError.message });
    } else if (followUps) {
      log.info('followups_found', { count: followUps.length });
      for (const followUp of followUps) {
        const contactData = followUp.contacts as unknown;
        const contact = Array.isArray(contactData) ? contactData[0] as { first_name: string; last_name: string } | undefined : contactData as { first_name: string; last_name: string } | null;
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Contato';
        
        notifications.push({
          userId: followUp.user_id,
          title: `📅 Follow-up: ${followUp.title}`,
          body: `Lembrete de acompanhamento com ${contactName}`,
          data: {
            type: 'followup',
            interactionId: followUp.id,
            contactId: followUp.contact_id
          },
          tag: `followup-${followUp.id}`
        });
      }
    }

    // Check for birthdays today
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    // 1. Birthdays from Contacts
    const { data: contacts, error: contactsError } = await supabaseClient
      .from('contacts')
      .select('id, first_name, last_name, birthday, user_id')
      .not('birthday', 'is', null);

    if (contactsError) {
      log.error('fetch_contacts_birthday_failed', { error: contactsError.message });
    } else if (contacts) {
      const todayBirthdays = contacts.filter(contact => {
        if (!contact.birthday) return false;
        const birthday = new Date(contact.birthday);
        const birthMonth = String(birthday.getMonth() + 1).padStart(2, '0');
        const birthDay = String(birthday.getDate()).padStart(2, '0');
        return birthMonth === month && birthDay === day;
      });

      log.info('contact_birthdays_found', { count: todayBirthdays.length });
      for (const contact of todayBirthdays) {
        notifications.push({
          userId: contact.user_id,
          title: `🎂 Aniversário: ${contact.first_name} ${contact.last_name}`,
          body: 'Não esqueça de enviar uma mensagem de parabéns!',
          data: { type: 'birthday', contactId: contact.id },
          tag: `birthday-${contact.id}`
        });
      }
    }

    // 2. Birthdays from Relatives
    const { data: relatives, error: relativesError } = await supabaseClient
      .from('contact_relatives')
      .select('id, name, relationship_type, birthday, user_id, contact_id')
      .not('birthday', 'is', null);

    if (relativesError) {
      log.error('fetch_relatives_birthday_failed', { error: relativesError.message });
    } else if (relatives) {
      const todayRelativeBirthdays = relatives.filter(rel => {
        if (!rel.birthday) return false;
        const birthday = new Date(rel.birthday);
        const birthMonth = String(birthday.getMonth() + 1).padStart(2, '0');
        const birthDay = String(birthday.getDate()).padStart(2, '0');
        return birthMonth === month && birthDay === day;
      });

      log.info('relative_birthdays_found', { count: todayRelativeBirthdays.length });
      for (const rel of todayRelativeBirthdays) {
        notifications.push({
          userId: rel.user_id,
          title: `🎂 Aniversário: ${rel.name} (${rel.relationship_type})`,
          body: `Aniversário de um familiar de seu contato. Fortaleça o rapport!`,
          data: { type: 'relative_birthday', relativeId: rel.id, contactId: rel.contact_id },
          tag: `rel-birthday-${rel.id}`
        });
      }
    }

    // 3. Life Events (Birthdays and Anniversaries)
    const { data: lifeEvents, error: lifeEventsError } = await supabaseClient
      .from('life_events')
      .select('id, title, event_type, event_date, user_id, contact_id')
      .in('event_type', ['birthday', 'anniversary'])
      .not('event_date', 'is', null);

    if (lifeEventsError) {
      log.error('fetch_life_events_failed', { error: lifeEventsError.message });
    } else if (lifeEvents) {
      const todayLifeEvents = lifeEvents.filter(ev => {
        if (!ev.event_date) return false;
        const date = new Date(ev.event_date);
        const evMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
        const evDay = String(date.getUTCDate()).padStart(2, '0');
        return evMonth === month && evDay === day;
      });

      log.info('life_event_reminders_found', { count: todayLifeEvents.length });
      for (const ev of todayLifeEvents) {
        notifications.push({
          userId: ev.user_id,
          title: `🌟 Marco: ${ev.title}`,
          body: `Hoje é um dia especial para seu contato!`,
          data: { type: 'life_event', eventId: ev.id, contactId: ev.contact_id },
          tag: `life-event-${ev.id}`
        });
      }
    }

    // Check for new insights (from last 24 hours)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: insights, error: insightsError } = await supabaseClient
      .from('insights')
      .select(`
        id,
        title,
        contact_id,
        user_id,
        contacts:contact_id (first_name, last_name)
      `)
      .eq('dismissed', false)
      .gte('created_at', yesterday.toISOString());

    if (insightsError) {
      log.error('fetch_insights_failed', { error: insightsError.message });
    } else if (insights) {
      log.info('insights_found', { count: insights.length });
      for (const insight of insights) {
        const contactData = insight.contacts as unknown;
        const contact = Array.isArray(contactData) ? contactData[0] as { first_name: string; last_name: string } | undefined : contactData as { first_name: string; last_name: string } | null;
        const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Contato';
        
        notifications.push({
          userId: insight.user_id,
          title: `💡 Novo Insight: ${insight.title}`,
          body: `Insight sobre ${contactName}`,
          data: {
            type: 'insight',
            insightId: insight.id,
            contactId: insight.contact_id
          },
          tag: `insight-${insight.id}`
        });
      }
    }

    // Send notifications
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    let sentCount = 0;
    
    for (const notification of notifications) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'x-trace-id': traceId
          },
          body: JSON.stringify({
            userId: notification.userId,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            tag: notification.tag
          })
        });
        
        if (response.ok) {
          sentCount++;
        } else {
          log.warn('push_send_failed', { userId: notification.userId, status: response.status });
        }
      } catch (error) {
        log.error('push_error', { userId: notification.userId, error: error instanceof Error ? error.message : String(error) });
      }
    }

    log.info("check_complete", { sentCount, total: notifications.length });

    return jsonOk({
      success: true,
      checked: {
        followUps: followUps?.length || 0,
        birthdays: contacts?.filter(c => {
          if (!c.birthday) return false;
          const birthday = new Date(c.birthday);
          const birthMonth = String(birthday.getMonth() + 1).padStart(2, '0');
          const birthDay = String(birthday.getDate()).padStart(2, '0');
          return birthMonth === month && birthDay === day;
        }).length || 0,
        insights: insights?.length || 0
      },
      notificationsSent: sentCount,
      totalNotifications: notifications.length,
      traceId
    }, req);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error("fatal_error", { error: errorMessage });
    return jsonError(errorMessage, 500, req);
  }
});
