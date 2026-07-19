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
  
  let sentimentScore = 50;
  if (contact.sentiment) {
    sentimentScore = sentimentMap[contact.sentiment] || 50;
  }
  
  const engagementLevel = contact.relationship_score || 50;
  
  const weights = {
    interactionFrequency: 0.35,
    sentimentScore: 0.25,
    engagementLevel: 0.25,
    recency: 0.15
  };
  
  const recencyScore = Math.max(0, 100 - (lastInteractionDays * 3));
  
  const score = Math.round(
    interactionFrequency * weights.interactionFrequency +
    sentimentScore * weights.sentimentScore +
    engagementLevel * weights.engagementLevel +
    recencyScore * weights.recency
  );
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (score <= 30) {
    status = 'critical';
  } else if (score <= 50) {
    status = 'warning';
  }
  
  return {
    contactId: contact.id,
    contactName: `${contact.first_name} ${contact.last_name}`,
    score,
    status,
    factors: {
      interactionFrequency,
      sentimentScore,
      engagementLevel,
      lastInteractionDays
    }
  };
}

Deno.serve(async (req) => {
  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "check-health-alerts");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // 🔒 Cron secret validation
  const cronError = await requireCronSecret(req);
  if (cronError) {
    log.warn("unauthorized_cron_access");
    return cronError;
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log.info("check_started");

    // Get all users' health alert settings (cron iterates all)
    const { data: allSettings, error: settingsError } = await supabase
      .from("health_alert_settings")
      .select("*");

    if (settingsError) {
      log.error("fetch_settings_failed", { error: settingsError.message });
      throw settingsError;
    }

    const settings: HealthAlertSettings[] = allSettings || [];

    if (settings.length === 0) {
      log.info("no_settings_found");
      return jsonOk({ success: true, alertsCreated: 0, notificationsSent: 0, message: 'No health alert settings configured', traceId }, req);
    }

    const alertsCreated: string[] = [];
    const notificationsSent: string[] = [];

    for (const userSettings of settings) {
      const { data: contacts, error: contactsError } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, relationship_score, sentiment, user_id")
        .eq("user_id", userSettings.user_id);

      if (contactsError) {
        log.error("fetch_contacts_failed", { userId: userSettings.user_id, error: contactsError.message });
        continue;
      }

      const { data: interactions, error: interactionsError } = await supabase
        .from("interactions")
        .select("contact_id, created_at, sentiment")
        .eq("user_id", userSettings.user_id)
        .order("created_at", { ascending: false });

      if (interactionsError) {
        log.error("fetch_interactions_failed", { userId: userSettings.user_id, error: interactionsError.message });
        continue;
      }

      for (const contact of contacts || []) {
        const healthScore = calculateHealthScore(contact, interactions || []);
        
        const shouldAlertCritical = userSettings.notify_on_critical && 
          healthScore.score <= userSettings.critical_threshold;
        const shouldAlertWarning = userSettings.notify_on_warning && 
          healthScore.score <= userSettings.warning_threshold &&
          healthScore.score > userSettings.critical_threshold;

        if (!shouldAlertCritical && !shouldAlertWarning) continue;

        const alertType = shouldAlertCritical ? 'critical' : 'warning';
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: existingAlerts } = await supabase
          .from("health_alerts")
          .select("id")
          .eq("contact_id", contact.id)
          .eq("user_id", userSettings.user_id)
          .eq("alert_type", alertType)
          .gte("created_at", oneDayAgo)
          .limit(1);

        if (existingAlerts && existingAlerts.length > 0) continue;

        const alertTitle = alertType === 'critical' 
          ? `⚠️ Saúde Crítica: ${healthScore.contactName}`
          : `⚡ Atenção: ${healthScore.contactName}`;
        
        const alertDescription = alertType === 'critical'
          ? `O cliente ${healthScore.contactName} está com saúde crítica (${healthScore.score}%). Último contato há ${healthScore.factors.lastInteractionDays} dias.`
          : `O cliente ${healthScore.contactName} precisa de atenção (${healthScore.score}%). Considere entrar em contato em breve.`;

        const { error: insertError } = await supabase
          .from("health_alerts")
          .insert({
            user_id: userSettings.user_id,
            contact_id: contact.id,
            alert_type: alertType,
            health_score: healthScore.score,
            title: alertTitle,
            description: alertDescription,
            factors: healthScore.factors,
            notified_via: []
          });

        if (insertError) {
          log.error("create_alert_failed", { contactId: contact.id, error: insertError.message });
          continue;
        }

        alertsCreated.push(healthScore.contactName);

        if (userSettings.push_notifications) {
          try {
            const { error: pushError } = await supabase.functions.invoke("send-push-notification", {
              body: {
                userId: userSettings.user_id,
                title: alertTitle,
                body: alertDescription,
                data: {
                  type: 'health_alert',
                  contactId: contact.id,
                  url: `/contato/${contact.id}`
                }
              },
              headers: { 'x-trace-id': traceId }
            });

            if (pushError) {
              log.warn("push_notif_failed", { userId: userSettings.user_id, error: pushError.message });
            } else {
              notificationsSent.push(`push:${healthScore.contactName}`);
            }
          } catch (pushErr) {
            log.error("push_notif_error", { userId: userSettings.user_id, error: pushErr instanceof Error ? pushErr.message : String(pushErr) });
          }
        }

        if (userSettings.email_notifications && userSettings.email_address) {
          log.info("email_simulated", { email: userSettings.email_address, contact: healthScore.contactName });
          notificationsSent.push(`email:${healthScore.contactName}`);
        }
      }
    }

    log.info("check_complete", { alertsCreated: alertsCreated.length, notificationsSent: notificationsSent.length });

    return jsonOk({
      success: true,
      alertsCreated: alertsCreated.length,
      notificationsSent: notificationsSent.length,
      details: {
        alerts: alertsCreated,
        notifications: notificationsSent
      },
      traceId
    }, req);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error("fatal_error", { error: errorMessage });
    return jsonError(errorMessage, 500, req);
  }
});
