import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret, jsonError, jsonOk } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

interface AlertData {
  type: 'birthday' | 'renewal' | 'at_risk' | 'health_alert' | 'life_event';
  title: string;
  body: string;
  url?: string;
  contactId?: string;
  userId: string;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "client-notifications");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const cronError = await requireCronSecret(req);
  if (cronError) {
    log.warn("unauthorized_cron_access");
    return cronError;
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    log.info('check_started');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 86_400_000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86_400_000);
    const oneWeekAgo = new Date(today.getTime() - 7 * 86_400_000);

    // Discover all active users (with contacts or renewals)
    const { data: userRows } = await supabase
      .from('contacts')
      .select('user_id')
      .limit(2000);
    const userIds = Array.from(new Set((userRows ?? []).map((r: { user_id: string }) => r.user_id)));

    log.info('users_to_process', { count: userIds.length });

    const allAlertsSent: AlertData[] = [];

    for (const userId of userIds) {
      try {
        // Parallelize all independent reads for this user
        const [
          { data: birthdayContacts },
          { data: renewals },
          { data: recentInteractionRows },
          { data: highValueContacts },
          { data: lifeEvents },
          // Batch-fetch recent at_risk alerts to avoid N+1 per contact
          { data: recentAtRiskAlerts },
        ] = await Promise.all([
          supabase.from('contacts')
            .select('id, first_name, last_name, birthday, relationship_score')
            .eq('user_id', userId)
            .not('birthday', 'is', null),
          supabase.from('purchase_history')
            .select('id, product_name, renewal_date, contact_id, contacts!inner(first_name, last_name)')
            .eq('user_id', userId)
            .not('renewal_date', 'is', null)
            .gte('renewal_date', today.toISOString())
            .lte('renewal_date', sevenDaysFromNow.toISOString()),
          supabase.from('interactions')
            .select('contact_id')
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgo.toISOString()),
          supabase.from('contacts')
            .select('id, first_name, last_name, relationship_score')
            .eq('user_id', userId)
            .gte('relationship_score', 60),
          supabase.from('life_events')
            .select('id, title, event_date, event_type, reminder_days_before, last_reminded_at, contact_id, recurring, contacts!inner(first_name, last_name)')
            .eq('user_id', userId),
          // Fetch all at_risk alerts from last 7 days in one shot (avoids N+1 per contact)
          supabase.from('alerts')
            .select('contact_id')
            .eq('user_id', userId)
            .eq('type', 'at_risk')
            .gte('created_at', oneWeekAgo.toISOString()),
        ]);

        const userAlerts: AlertData[] = [];

        // 1. Birthdays
        for (const contact of birthdayContacts ?? []) {
          if (!contact.birthday) continue;
          const bday = new Date(contact.birthday);
          const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
          if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
          const daysUntil = Math.ceil((thisYearBday.getTime() - today.getTime()) / 86_400_000);
          if (daysUntil === 0 || daysUntil === 7) {
            userAlerts.push({
              type: 'birthday',
              title: daysUntil === 0 ? `🎂 Aniversário Hoje!` : `🎂 Aniversário em 7 dias`,
              body: daysUntil === 0
                ? `${contact.first_name} ${contact.last_name} faz aniversário hoje!`
                : `${contact.first_name} ${contact.last_name} fará aniversário em uma semana`,
              url: `/contatos/${contact.id}`,
              contactId: contact.id,
              userId,
            });
          }
        }

        // 2. Renewals
        for (const renewal of renewals ?? []) {
          const contact = renewal.contacts as unknown as { first_name: string; last_name: string };
          const renewalDate = new Date(renewal.renewal_date);
          const daysUntil = Math.ceil((renewalDate.getTime() - today.getTime()) / 86_400_000);
          if (daysUntil <= 7) {
            userAlerts.push({
              type: 'renewal',
              title: `🔄 Renovação em ${daysUntil} dia(s)`,
              body: `${renewal.product_name} de ${contact.first_name} ${contact.last_name}`,
              url: `/contatos/${renewal.contact_id}`,
              contactId: renewal.contact_id,
              userId,
            });
          }
        }

        // 3. At-risk contacts (fixed N+1: use Set from batch-fetched recent alerts)
        const recentContactIds = new Set((recentInteractionRows ?? []).map((i: { contact_id: string }) => i.contact_id));
        const recentlyAlertedContactIds = new Set((recentAtRiskAlerts ?? []).map((a: { contact_id: string }) => a.contact_id));
        for (const contact of highValueContacts ?? []) {
          if (!recentContactIds.has(contact.id) && !recentlyAlertedContactIds.has(contact.id)) {
            userAlerts.push({
              type: 'at_risk',
              title: `⚠️ Cliente em Risco`,
              body: `${contact.first_name} ${contact.last_name} está há mais de 30 dias sem contato`,
              url: `/contatos/${contact.id}`,
              contactId: contact.id,
              userId,
            });
          }
        }

        // 4. Life events
        const lifeEventUpdates: string[] = [];
        for (const event of lifeEvents ?? []) {
          const contact = event.contacts as unknown as { first_name: string; last_name: string };
          let eventDate = new Date(event.event_date);
          if (event.recurring) {
            const next = new Date(today.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            if (next < today) next.setFullYear(today.getFullYear() + 1);
            eventDate = next;
          }
          const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / 86_400_000);
          const reminderDays = event.reminder_days_before || 7;
          if (daysUntil >= 0 && daysUntil <= reminderDays) {
            if (event.last_reminded_at) {
              const daysSince = (today.getTime() - new Date(event.last_reminded_at).getTime()) / 86_400_000;
              if (daysSince < 1) continue;
            }
            userAlerts.push({
              type: 'life_event',
              title: daysUntil === 0 ? `📅 Evento Hoje!` : `📅 Evento em ${daysUntil} dia(s)`,
              body: `${event.title} - ${contact.first_name} ${contact.last_name}`,
              url: `/contatos/${event.contact_id}`,
              contactId: event.contact_id,
              userId,
            });
            lifeEventUpdates.push(event.id);
          }
        }

        if (userAlerts.length > 0) {
          // Batch-insert all alerts for this user in one query (not 1 per subscription!)
          await supabase.from('alerts').insert(
            userAlerts.map(a => ({
              user_id: userId,
              title: a.title,
              description: a.body,
              type: a.type,
              contact_id: a.contactId ?? null,
              action_url: a.url ?? null,
              priority: a.type === 'at_risk' || a.type === 'health_alert' ? 'high' : 'medium',
            }))
          );
          allAlertsSent.push(...userAlerts);
        }

        // Batch-update life_event last_reminded_at
        if (lifeEventUpdates.length > 0) {
          await supabase.from('life_events')
            .update({ last_reminded_at: now.toISOString() })
            .in('id', lifeEventUpdates);
        }
      } catch (userErr) {
        log.error('user_processing_failed', { userId, error: userErr instanceof Error ? userErr.message : String(userErr) });
      }
    }

    log.info('check_complete', { alertsSent: allAlertsSent.length });

    return jsonOk({
      success: true,
      notificationsSent: allAlertsSent.length,
      notifications: allAlertsSent.map(a => ({ type: a.type, title: a.title })),
      traceId,
    }, req);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log.error("fatal_error", { error: msg });
    return jsonError(msg, 500, req);
  }
});
