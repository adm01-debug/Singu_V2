import { createClient } from "npm:@supabase/supabase-js@2";
import { guardBody, scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";

interface TemplateStats {
  templateId: string;
  templateTitle: string;
  triggerType: string;
  discProfile: string;
  totalUsages: number;
  successCount: number;
  successRate: number;
  avgRating: number;
}

interface HighPerformingTemplate {
  templateId: string;
  templateTitle: string;
  triggerType: string;
  discProfile: string;
  successRate: number;
  totalUsages: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // 🔒 Cron secret validation
  const cronError = await requireCronSecret(req);
  if (cronError) return cronError;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, checkAll = false } = rawBody as { userId?: string; checkAll?: boolean };

    // Get all users or specific user
    let usersQuery = supabaseClient.from('profiles').select('id');
    if (userId && !checkAll) {
      usersQuery = usersQuery.eq('id', userId);
    }

    const { data: users, error: usersError } = await usersQuery;
    if (usersError) throw usersError;

    const notifications: Array<{
      userId: string;
      templates: HighPerformingTemplate[];
    }> = [];

    for (const user of users || []) {
      // Get user's favorite templates
      const { data: favorites, error: favError } = await supabaseClient
        .from('favorite_templates')
        .select('template_id')
        .eq('user_id', user.id);

      if (favError) {
        console.error('Error fetching favorites:', favError);
        continue;
      }

      if (!favorites || favorites.length === 0) continue;

      const favoriteIds = favorites.map(f => f.template_id);

      // Get trigger usage history for this user
      const { data: usageHistory, error: usageError } = await supabaseClient
        .from('trigger_usage_history')
        .select(`
          id,
          trigger_type,
          template_id,
          template_title,
          result,
          effectiveness_rating,
          contact_id
        `)
        .eq('user_id', user.id)
        .not('template_id', 'is', null);

      if (usageError) {
        console.error('Error fetching usage history:', usageError);
        continue;
      }

      // Get contacts to map DISC profiles
      const { data: contacts, error: contactsError } = await supabaseClient
        .from('contacts')
        .select('id, behavior')
        .eq('user_id', user.id);

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        continue;
      }

      // Create contact DISC map
      const contactDISCMap = new Map<string, string>();
      contacts?.forEach((contact) => {
        const behavior = contact.behavior as { discProfile?: string } | null;
        if (behavior?.discProfile) {
          contactDISCMap.set(contact.id, behavior.discProfile);
        }
      });

      // Aggregate stats by template + DISC profile
      const templateDISCStats = new Map<string, TemplateStats>();

      usageHistory?.forEach((usage) => {
        if (!usage.template_id) return;
        
        const discProfile = contactDISCMap.get(usage.contact_id) || 'unknown';
        const key = `${usage.template_id}__${discProfile}`;

        if (!templateDISCStats.has(key)) {
          templateDISCStats.set(key, {
            templateId: usage.template_id,
            templateTitle: usage.template_title || '',
            triggerType: usage.trigger_type,
            discProfile,
            totalUsages: 0,
            successCount: 0,
            successRate: 0,
            avgRating: 0,
          });
        }

        const stats = templateDISCStats.get(key)!;
        stats.totalUsages++;
        if (usage.result === 'success') {
          stats.successCount++;
        }
        if (usage.effectiveness_rating) {
          stats.avgRating = (stats.avgRating * (stats.totalUsages - 1) + usage.effectiveness_rating) / stats.totalUsages;
        }
      });

      // Calculate success rates and find high performers
      const highPerformers: HighPerformingTemplate[] = [];

      templateDISCStats.forEach((stats) => {
        stats.successRate = stats.totalUsages > 0 
          ? (stats.successCount / stats.totalUsages) * 100 
          : 0;

        // Check if this is a favorite template with high success rate
        // Criteria: at least 3 usages, 70%+ success rate, specific DISC profile
        if (
          favoriteIds.includes(stats.templateId) &&
          stats.totalUsages >= 3 &&
          stats.successRate >= 70 &&
          stats.discProfile !== 'unknown'
        ) {
          highPerformers.push({
            templateId: stats.templateId,
            templateTitle: stats.templateTitle,
            triggerType: stats.triggerType,
            discProfile: stats.discProfile,
            successRate: stats.successRate,
            totalUsages: stats.totalUsages,
          });
        }
      });

      if (highPerformers.length > 0) {
        notifications.push({
          userId: user.id,
          templates: highPerformers,
        });
      }
    }

    // Send push notifications for each user
    const notificationResults = [];

    for (const notification of notifications) {
      const { templates, userId: notifUserId } = notification;
      
      // Get the best performer to highlight
      const bestTemplate = templates.sort((a, b) => b.successRate - a.successRate)[0];
      
      const discNames: Record<string, string> = {
        D: 'Dominante',
        I: 'Influente', 
        S: 'Estável',
        C: 'Conforme',
      };

      const discName = discNames[bestTemplate.discProfile] || bestTemplate.discProfile;

      // Create notification message
      const title = '🎯 Template de Alta Performance!';
      const body = `"${bestTemplate.templateTitle}" tem ${bestTemplate.successRate.toFixed(0)}% de sucesso com perfil ${discName}!`;

      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabaseClient
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', notifUserId);

      if (subError || !subscriptions?.length) {
        notificationResults.push({ userId: notifUserId, sent: false, reason: 'No subscriptions' });
        continue;
      }

      // Also create an in-app notification/alert
      const { error: alertError } = await supabaseClient
        .from('alerts')
        .insert({
          user_id: notifUserId,
          title,
          description: body + ` Use este template com clientes ${discName} para melhores resultados.`,
          type: 'template_success',
          priority: 'medium',
          action_url: '/contatos',
        });

      if (alertError) {
        console.error('Error creating alert:', alertError);
      }

      // Send push notification via the send-push-notification function
      try {
        const pushResponse = await fetchAPI(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              userId: notifUserId,
              title,
              body,
              data: {
                type: 'template_success',
                templateId: bestTemplate.templateId,
                discProfile: bestTemplate.discProfile,
                successRate: bestTemplate.successRate,
              },
              tag: 'template-success',
              requireInteraction: false,
            }),
          }
        );

        const pushResult = await pushResponse.json();
        notificationResults.push({ 
          userId: notifUserId, 
          sent: pushResult.success, 
          templates: templates.length,
          bestTemplate: bestTemplate.templateTitle,
        });
      } catch (pushError) {
        console.error('Error sending push:', pushError);
        notificationResults.push({ userId: notifUserId, sent: false, reason: 'Push error' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        usersAnalyzed: users?.length || 0,
        notificationsSent: notificationResults.filter(r => r.sent).length,
        results: notificationResults,
      }),
      { headers: { ...scopedCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...scopedCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
