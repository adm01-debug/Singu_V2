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

// eslint-disable-next-line sonarjs/cognitive-complexity -- orquestração linear de handler HTTP com muitos guards; refactor rastreado como tech-debt (ADR-020)
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

    const { data: userRows } = await supabase
      .from('contacts')
      .select('user_id')
      .limit(2000);
    const userIds = Array.from(new Set((userRows ?? []).map((r: { user_id: string }) => r.user_id)));

    log.info('users_to_process', { count: userIds.length });

    if (userIds.length === 0) {
      return jsonOk({ success: true, notificationsSent: 0, notifications: [], traceId }, req);
    }

    // --- PRE-BATCH PHASE: all 6 reads across all users in one round-trip ---
    const [
      birthdayResult,
      renewalResult,
      recentInteractionsResult,
      highValueResult,
      lifeEventsResult,
      recentAtRiskResult,
    ] = await Promise.all([
      supabase.from('contacts')
        .select('id, user_id, first_name, last_name, birthday, relationship_score')
        .in('user_id', userIds)
        .not('birthday', 'is', null)
        .limit(100_000),
      supabase.from('purchase_history')
        .select('id, user_id, product_name, renewal_date, contact_id, contacts!inner(first_name, last_name)')
        .in('user_id', userIds)
        .not('renewal_date', 'is', null)
        .gte('renewal_date', today.toISOString())
        .lte('renewal_date', sevenDaysFromNow.toISOString())
        .limit(100_000),
      supabase.from('interactions')
        .select('user_id, contact_id')
        .in('user_id', userIds)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(100_000),
      supabase.from('contacts')
        .select('id, user_id, first_name, last_name, relationship_score')
        .in('user_id', userIds)
        .gte('relationship_score', 60)
        .limit(100_000),
      supabase.from('life_events')
        .select('id, user_id, title, event_date, event_type, reminder_days_before, last_reminded_at, contact_id, recurring, contacts!inner(first_name, last_name)')
        .in('user_id', userIds)
        .limit(100_000),
      supabase.from('alerts')
        .select('user_id, contact_id')
        .in('user_id', userIds)
        .eq('type', 'at_risk')
        .gte('created_at', oneWeekAgo.toISOString())
        .limit(100_000),
    ]);

    // Build per-user Maps for O(1) loop lookups
    type ContactRow = { id: string; user_id: string; first_name: string; last_name: string; birthday: string | null; relationship_score: number | null };
    type RenewalRow = { id: string; user_id: string; product_name: string; renewal_date: string; contact_id: string; contacts: unknown };
    type InteractionRow = { user_id: string; contact_id: string };
    type LifeEventRow = { id: string; user_id: string; title: string; event_date: string; event_type: string; reminder_days_before: number | null; last_reminded_at: string | null; contact_id: string; recurring: boolean | null; contacts: unknown };
    type AlertRow = { user_id: string; contact_id: string };

    function groupByUser<T extends { user_id: string }>(rows: T[] | null): Map<string, T[]> {
      const m = new Map<string, T[]>();
      for (const r of rows ?? []) {
        const arr = m.get(r.user_id) ?? [];
        arr.push(r);
        m.set(r.user_id, arr);
      }
      return m;
    }

    const birthdayByUser = groupByUser(birthdayResult.data as ContactRow[] | null);
    const renewalByUser = groupByUser(renewalResult.data as RenewalRow[] | null);
    const lifeEventsByUser = groupByUser(lifeEventsResult.data as LifeEventRow[] | null);
    const highValueByUser = groupByUser(highValueResult.data as ContactRow[] | null);

    // Interaction Set per user (for at-risk detection)
    const recentContactsByUser = new Map<string, Set<string>>();
    for (const r of (recentInteractionsResult.data ?? []) as InteractionRow[]) {
      const s = recentContactsByUser.get(r.user_id) ?? new Set<string>();
      s.add(r.contact_id);
      recentContactsByUser.set(r.user_id, s);
    }

    // At-risk alerted Set per user
    const recentlyAlertedByUser = new Map<string, Set<string>>();
    for (const r of (recentAtRiskResult.data ?? []) as AlertRow[]) {
      const s = recentlyAlertedByUser.get(r.user_id) ?? new Set<string>();
      s.add(r.contact_id);
      recentlyAlertedByUser.set(r.user_id, s);
    }

    // --- COMPUTATION LOOP (pure in-memory) ---
    const allAlertsSent: AlertData[] = [];
    const allAlertRows: Array<Record<string, unknown>> = [];
    const allLifeEventUpdateIds: string[] = [];

    for (const userId of userIds) {
      try {
        const userAlerts: AlertData[] = [];

        // 1. Birthdays
        for (const contact of birthdayByUser.get(userId) ?? []) {
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
        for (const renewal of renewalByUser.get(userId) ?? []) {
          const contact = renewal.contacts as { first_name: string; last_name: string };
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

        // 3. At-risk contacts
        const recentContactSet = recentContactsByUser.get(userId) ?? new Set<string>();
        const recentlyAlertedSet = recentlyAlertedByUser.get(userId) ?? new Set<string>();
        for (const contact of highValueByUser.get(userId) ?? []) {
          if (!recentContactSet.has(contact.id) && !recentlyAlertedSet.has(contact.id)) {
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
        for (const event of lifeEventsByUser.get(userId) ?? []) {
          const contact = event.contacts as { first_name: string; last_name: string };
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
            allLifeEventUpdateIds.push(event.id);
          }
        }

        for (const a of userAlerts) {
          allAlertRows.push({
            user_id: userId,
            title: a.title,
            description: a.body,
            type: a.type,
            contact_id: a.contactId ?? null,
            action_url: a.url ?? null,
            priority: a.type === 'at_risk' || a.type === 'health_alert' ? 'high' : 'medium',
          });
        }
        allAlertsSent.push(...userAlerts);
      } catch (userErr) {
        log.error('user_processing_failed', { userId, error: userErr instanceof Error ? userErr.message : String(userErr) });
      }
    }

    // --- BULK FLUSH ---
    const [alertsRes, eventsRes] = await Promise.all([
      allAlertRows.length > 0 ? supabase.from('alerts').insert(allAlertRows) : Promise.resolve({ error: null }),
      allLifeEventUpdateIds.length > 0
        ? supabase.from('life_events').update({ last_reminded_at: now.toISOString() }).in('id', allLifeEventUpdateIds)
        : Promise.resolve({ error: null }),
    ]);
    if (alertsRes.error) log.error('alerts_insert_failed', { error: alertsRes.error.message });
    if (eventsRes.error) log.error('life_events_update_failed', { error: eventsRes.error.message });

    log.info('check_complete', { alertsSent: allAlertsSent.length });

    return jsonOk({
      success: true,
      notificationsSent: allAlertsSent.length,
      notifications: allAlertsSent.map(a => ({ type: a.type, title: a.title })),
      traceId,
    }, req);

  } catch (error: unknown) {
    log.error("fatal_error", { error: error instanceof Error ? error.message : String(error) });
    return jsonError("Internal server error", 500, req);
  }
});
