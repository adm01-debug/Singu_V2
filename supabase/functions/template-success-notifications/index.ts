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

    const userList = users ?? [];
    const notifications: Array<{
      userId: string;
      templates: HighPerformingTemplate[];
    }> = [];

    if (userList.length > 0) {
      // Pre-fetch all data for all users in three parallel queries
      const userIds = userList.map((u: { id: string }) => u.id);
      const [favResult, usageResult, contactResult] = await Promise.all([
        supabaseClient.from('favorite_templates').select('user_id, template_id').in('user_id', userIds),
        supabaseClient.from('trigger_usage_history').select('user_id, id, trigger_type, template_id, template_title, result, effectiveness_rating, contact_id').in('user_id', userIds).not('template_id', 'is', null),
        supabaseClient.from('contacts').select('user_id, id, behavior').in('user_id', userIds),
      ]);

      if (favResult.error) console.error('Error fetching favorites:', favResult.error);
      if (usageResult.error) console.error('Error fetching usage history:', usageResult.error);
      if (contactResult.error) console.error('Error fetching contacts:', contactResult.error);

      // Build per-user Maps
      const favoritesByUser = new Map<string, string[]>();
      for (const f of favResult.data ?? []) {
        if (!favoritesByUser.has(f.user_id)) favoritesByUser.set(f.user_id, []);
        favoritesByUser.get(f.user_id)!.push(f.template_id);
      }

      const usageByUser = new Map<string, typeof usageResult.data>();
      for (const u of usageResult.data ?? []) {
        if (!usageByUser.has(u.user_id)) usageByUser.set(u.user_id, []);
        usageByUser.get(u.user_id)!.push(u);
      }

      const contactsByUser = new Map<string, Map<string, string>>();
      for (const c of contactResult.data ?? []) {
        if (!contactsByUser.has(c.user_id)) contactsByUser.set(c.user_id, new Map());
        const behavior = c.behavior as { discProfile?: string } | null;
        if (behavior?.discProfile) contactsByUser.get(c.user_id)!.set(c.id, behavior.discProfile);
      }

      for (const user of userList) {
        const favoriteIds = favoritesByUser.get(user.id) ?? [];
        if (favoriteIds.length === 0) continue;

        const usageHistory = usageByUser.get(user.id) ?? [];
        const contactDISCMap = contactsByUser.get(user.id) ?? new Map<string, string>();

        // Aggregate stats by template + DISC profile
        const templateDISCStats = new Map<string, TemplateStats>();

        for (const usage of usageHistory) {
          if (!usage.template_id) continue;
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
          if (usage.result === 'success') stats.successCount++;
          if (usage.effectiveness_rating) {
            stats.avgRating = (stats.avgRating * (stats.totalUsages - 1) + usage.effectiveness_rating) / stats.totalUsages;
          }
        }

        const highPerformers: HighPerformingTemplate[] = [];
        templateDISCStats.forEach((stats) => {
          stats.successRate = stats.totalUsages > 0 ? (stats.successCount / stats.totalUsages) * 100 : 0;
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
          notifications.push({ userId: user.id, templates: highPerformers });
        }
      }
    }

    // Send push notifications for each user
    const notificationResults = [];

    if (notifications.length > 0) {
      const notifUserIds = notifications.map(n => n.userId);

      // Pre-fetch all push subscriptions + build alerts bulk insert
      const { data: allSubs } = await supabaseClient
        .from('push_subscriptions').select('user_id').in('user_id', notifUserIds);
      const subsWithData = new Set((allSubs ?? []).map((s: { user_id: string }) => s.user_id));

      const discNames: Record<string, string> = { D: 'Dominante', I: 'Influente', S: 'Estável', C: 'Conforme' };

      type NotifPayload = { userId: string; title: string; body: string; bestTemplate: HighPerformingTemplate; discName: string; hasSubscription: boolean };
      const payloads: NotifPayload[] = notifications.map(({ templates, userId: notifUserId }) => {
        const bestTemplate = [...templates].sort((a, b) => b.successRate - a.successRate)[0];
        const discName = discNames[bestTemplate.discProfile] || bestTemplate.discProfile;
        const title = '🎯 Template de Alta Performance!';
        const body = `"${bestTemplate.templateTitle}" tem ${bestTemplate.successRate.toFixed(0)}% de sucesso com perfil ${discName}!`;
        return { userId: notifUserId, title, body, bestTemplate, discName, hasSubscription: subsWithData.has(notifUserId) };
      });

      // Bulk-insert all in-app alerts at once
      const alertRows = payloads.map(p => ({
        user_id: p.userId,
        title: p.title,
        description: p.body + ` Use este template com clientes ${p.discName} para melhores resultados.`,
        type: 'template_success',
        priority: 'medium',
        action_url: '/contatos',
      }));
      if (alertRows.length > 0) {
        const { error: alertError } = await supabaseClient.from('alerts').insert(alertRows);
        if (alertError) console.error('Error creating alerts:', alertError);
      }

      // Send push notifications in parallel for users with subscriptions
      const pushResults = await Promise.all(
        payloads.map(async (p) => {
          if (!p.hasSubscription) {
            return { userId: p.userId, sent: false, reason: 'No subscriptions' };
          }
          try {
            const pushResponse = await fetchAPI(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
                body: JSON.stringify({
                  userId: p.userId,
                  title: p.title,
                  body: p.body,
                  data: { type: 'template_success', templateId: p.bestTemplate.templateId, discProfile: p.bestTemplate.discProfile, successRate: p.bestTemplate.successRate },
                  tag: 'template-success',
                  requireInteraction: false,
                }),
              }
            );
            const pushResult = await pushResponse.json();
            return { userId: p.userId, sent: pushResult.success, templates: notifications.find(n => n.userId === p.userId)?.templates.length, bestTemplate: p.bestTemplate.templateTitle };
          } catch (pushError) {
            console.error('Error sending push:', pushError);
            return { userId: p.userId, sent: false, reason: 'Push error' };
          }
        })
      );
      notificationResults.push(...pushResults);
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
    console.error('template-success-notifications error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...scopedCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
