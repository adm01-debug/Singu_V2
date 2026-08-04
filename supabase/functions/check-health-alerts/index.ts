import { createClient } from "npm:@supabase/supabase-js@2";
import {
  scopedCorsHeaders, requireCronSecret,
  jsonError,
  jsonOk,
} from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  relationship_score: number | null;
  sentiment: string | null;
  user_id: string;
}

interface Interaction {
  contact_id: string;
  created_at: string;
  sentiment: string | null;
  user_id: string;
}

interface HealthAlertSettings {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  critical_threshold: number;
  warning_threshold: number;
  notify_on_critical: boolean;
  notify_on_warning: boolean;
  email_address: string | null;
}

interface HealthScore {
  contactId: string;
  contactName: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  factors: {
    interactionFrequency: number;
    sentimentScore: number;
    engagementLevel: number;
    lastInteractionDays: number;
  };
}

function calculateHealthScore(
  contact: Contact,
  interactions: Interaction[]
): HealthScore {
  const contactInteractions = interactions.filter(i => i.contact_id === contact.id);
  const now = new Date();

  let lastInteractionDays = 999;
  if (contactInteractions.length > 0) {
    const lastInteraction = new Date(contactInteractions[0].created_at);
    lastInteractionDays = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentInteractions = contactInteractions.filter(i => new Date(i.created_at) >= thirtyDaysAgo);
  const interactionFrequency = Math.min(100, recentInteractions.length * 20);

  const sentimentMap: Record<string, number> = {
    'very_positive': 100,
    'positive': 80,
    'neutral': 50,
    'negative': 20,
    'very_negative': 0
  };

  const sentimentScore = contact.sentiment ? (sentimentMap[contact.sentiment] ?? 50) : 50;
  const engagementLevel = contact.relationship_score ?? 50;

  const recencyScore = Math.max(0, 100 - (lastInteractionDays * 3));

  const score = Math.round(
    interactionFrequency * 0.35 +
    sentimentScore * 0.25 +
    engagementLevel * 0.25 +
    recencyScore * 0.15
  );

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (score <= 30) status = 'critical';
  else if (score <= 50) status = 'warning';

  return {
    contactId: contact.id,
    contactName: `${contact.first_name} ${contact.last_name}`,
    score,
    status,
    factors: { interactionFrequency, sentimentScore, engagementLevel, lastInteractionDays }
  };
}

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "check-health-alerts");

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
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    log.info("check_started");

    const { data: allSettings, error: settingsError } = await supabase
      .from("health_alert_settings")
      .select("*");

    if (settingsError) {
      log.error("fetch_settings_failed", { error: settingsError.message });
      throw settingsError;
    }

    const settings: HealthAlertSettings[] = allSettings ?? [];
    if (settings.length === 0) {
      log.info("no_settings_found");
      return jsonOk({ success: true, alertsCreated: 0, notificationsSent: 0, message: 'No health alert settings configured', traceId }, req);
    }

    const allUserIds = settings.map(s => s.user_id);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Batch-fetch all data for all users in three parallel queries
    const [contactsResult, interactionsResult, recentAlertsResult] = await Promise.all([
      supabase.from("contacts")
        .select("id, first_name, last_name, relationship_score, sentiment, user_id")
        .in("user_id", allUserIds),
      supabase.from("interactions")
        .select("contact_id, created_at, sentiment, user_id")
        .in("user_id", allUserIds)
        .order("created_at", { ascending: false }),
      supabase.from("health_alerts")
        .select("contact_id, user_id, alert_type")
        .in("user_id", allUserIds)
        .gte("created_at", oneDayAgo),
    ]);

    if (contactsResult.error) log.error("fetch_contacts_failed", { error: contactsResult.error.message });
    if (interactionsResult.error) log.error("fetch_interactions_failed", { error: interactionsResult.error.message });

    // Build lookup Maps
    const contactsByUser = new Map<string, Contact[]>();
    for (const c of contactsResult.data ?? []) {
      if (!contactsByUser.has(c.user_id)) contactsByUser.set(c.user_id, []);
      contactsByUser.get(c.user_id)!.push(c);
    }

    const interactionsByUser = new Map<string, Interaction[]>();
    for (const i of interactionsResult.data ?? []) {
      if (!interactionsByUser.has(i.user_id)) interactionsByUser.set(i.user_id, []);
      interactionsByUser.get(i.user_id)!.push(i);
    }

    // Set of already-alerted keys to avoid duplicates: `${contact_id}:${user_id}:${alert_type}`
    const recentAlertSet = new Set<string>(
      (recentAlertsResult.data ?? []).map(a => `${a.contact_id}:${a.user_id}:${a.alert_type}`)
    );

    // Accumulate new alert rows and push targets
    type NewAlert = Record<string, unknown>;
    type PushTarget = { userId: string; title: string; body: string; contactId: string };
    const newAlertRows: NewAlert[] = [];
    const pushTargets: PushTarget[] = [];
    const alertsCreated: string[] = [];
    const notificationsSent: string[] = [];

    for (const userSettings of settings) {
      const contacts = contactsByUser.get(userSettings.user_id) ?? [];
      const interactions = interactionsByUser.get(userSettings.user_id) ?? [];

      for (const contact of contacts) {
        const healthScore = calculateHealthScore(contact, interactions);

        const shouldAlertCritical = userSettings.notify_on_critical &&
          healthScore.score <= userSettings.critical_threshold;
        const shouldAlertWarning = userSettings.notify_on_warning &&
          healthScore.score <= userSettings.warning_threshold &&
          healthScore.score > userSettings.critical_threshold;

        if (!shouldAlertCritical && !shouldAlertWarning) continue;

        const alertType = shouldAlertCritical ? 'critical' : 'warning';
        const alertKey = `${contact.id}:${userSettings.user_id}:${alertType}`;
        if (recentAlertSet.has(alertKey)) continue;

        const alertTitle = alertType === 'critical'
          ? `⚠️ Saúde Crítica: ${healthScore.contactName}`
          : `⚡ Atenção: ${healthScore.contactName}`;

        const alertDescription = alertType === 'critical'
          ? `O cliente ${healthScore.contactName} está com saúde crítica (${healthScore.score}%). Último contato há ${healthScore.factors.lastInteractionDays} dias.`
          : `O cliente ${healthScore.contactName} precisa de atenção (${healthScore.score}%). Considere entrar em contato em breve.`;

        newAlertRows.push({
          user_id: userSettings.user_id,
          contact_id: contact.id,
          alert_type: alertType,
          health_score: healthScore.score,
          title: alertTitle,
          description: alertDescription,
          factors: healthScore.factors,
          notified_via: []
        });
        alertsCreated.push(healthScore.contactName);

        if (userSettings.push_notifications) {
          pushTargets.push({ userId: userSettings.user_id, title: alertTitle, body: alertDescription, contactId: contact.id });
        }
        if (userSettings.email_notifications && userSettings.email_address) {
          log.info("email_simulated", { email: userSettings.email_address, contact: healthScore.contactName });
          notificationsSent.push(`email:${healthScore.contactName}`);
        }
      }
    }

    // Bulk-insert all new alerts in one call
    if (newAlertRows.length > 0) {
      const { error: insertError } = await supabase.from("health_alerts").insert(newAlertRows);
      if (insertError) log.error("bulk_create_alerts_failed", { error: insertError.message });
    }

    // Send push notifications in parallel (can't be batched into a single payload)
    const pushResults = await Promise.allSettled(
      pushTargets.map(async (t) => {
        const { error: pushError } = await supabase.functions.invoke("send-push-notification", {
          body: {
            userId: t.userId,
            title: t.title,
            body: t.body,
            data: { type: 'health_alert', contactId: t.contactId, url: `/contato/${t.contactId}` }
          },
          headers: { 'x-trace-id': traceId }
        });
        if (pushError) {
          log.warn("push_notif_failed", { userId: t.userId, error: pushError.message });
          return;
        }
        notificationsSent.push(`push:${t.contactId}`);
      })
    );
    pushResults.forEach((r, i) => {
      if (r.status === "rejected") {
        log.error("push_notif_error", { userId: pushTargets[i].userId, error: String(r.reason) });
      }
    });

    log.info("check_complete", { alertsCreated: alertsCreated.length, notificationsSent: notificationsSent.length });

    return jsonOk({
      success: true,
      alertsCreated: alertsCreated.length,
      notificationsSent: notificationsSent.length,
      details: { alerts: alertsCreated, notifications: notificationsSent },
      traceId
    }, req);
  } catch (error: unknown) {
    log.error("fatal_error", { error: error instanceof Error ? error.message : String(error) });
    return jsonError("Internal server error", 500, req);
  }
});
