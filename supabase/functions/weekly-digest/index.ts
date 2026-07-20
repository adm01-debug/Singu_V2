import { createClient } from "npm:@supabase/supabase-js@2";
import { guardBody, scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";

interface WeeklyDigestData {
  userId: string;
  email: string;
  firstName: string;
  stats: {
    totalInteractions: number;
    newContacts: number;
    upcomingBirthdays: number;
    atRiskContacts: number;
    pendingFollowUps: number;
  };
  highlights: string[];
  recommendations: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  // 🔒 Cron secret validation
  const cronError = await requireCronSecret(req);
  if (cronError) return cronError;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if called from cron
    const requestBody = (rawBody as { source?: string; userId?: string }) ?? {};

    const isCronJob = requestBody.source === 'cron';
    const specificUserId = requestBody.userId;

    console.log(`Starting weekly digest generation... Source: ${isCronJob ? 'cron' : 'manual'}`);

    // Get current day and time
    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getUTCDay()];
    const currentHour = now.getUTCHours();

    // Get users with enabled weekly report settings
    let settingsQuery = supabase
      .from('weekly_report_settings')
      .select('*')
      .eq('enabled', true);

    // If it's a cron job, filter by day (allow 1 hour window)
    if (isCronJob) {
      settingsQuery = settingsQuery.eq('send_day', currentDay);
    }

    // If specific user, only get their settings
    if (specificUserId) {
      settingsQuery = settingsQuery.eq('user_id', specificUserId);
    }

    const { data: reportSettings, error: settingsError } = await settingsQuery;

    if (settingsError) {
      console.error('Error fetching report settings:', settingsError);
      throw settingsError;
    }

    // Filter by hour if cron job
    const eligibleSettings = isCronJob 
      ? (reportSettings || []).filter(s => {
          if (!s.send_time) return currentHour === 9;
          const settingHour = parseInt(s.send_time.split(':')[0], 10);
          return Math.abs(settingHour - currentHour) <= 1;
        })
      : reportSettings || [];

    console.log(`Found ${eligibleSettings.length} users eligible for report generation`);

    if (eligibleSettings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users eligible for report at this time',
          digestsGenerated: 0 
        }),
        { 
          status: 200, 
          headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } 
        }
      );
    }

    const digests: WeeklyDigestData[] = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const settings of eligibleSettings) {
      const userId = settings.user_id;

      try {
      // Parallelize all reads for this user — turns 7 sequential round-trips into 1 batch
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 86_400_000);
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 86_400_000);

      const [
        { data: profile },
        { data: userData },
        { count: totalInteractions },
        { count: newContactsCount },
        { data: birthdayContacts },
        { count: pendingFollowUpsCount },
        { data: recentInteractionContacts },
        { count: totalContacts },
      ] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name').eq('id', userId).single(),
        supabase.auth.admin.getUserById(userId),
        supabase.from('interactions').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('contacts').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('contacts').select('id, birthday').eq('user_id', userId).not('birthday', 'is', null),
        supabase.from('interactions').select('*', { count: 'exact', head: true })
          .eq('user_id', userId).eq('follow_up_required', true)
          .lte('follow_up_date', today.toISOString()),
        supabase.from('interactions').select('contact_id')
          .eq('user_id', userId).gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      if (!profile || !userData?.user?.email) continue;

      // Check for upcoming birthdays (next 7 days)
      const upcomingBirthdayCount = (birthdayContacts || []).filter(contact => {
        const birthday = new Date(contact.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
      }).length;

      // Calculate at-risk contacts (no interaction in 30+ days)
      const contactsWithRecentInteraction = new Set(
        recentInteractionContacts?.map((i: { contact_id: string }) => i.contact_id) || []
      );
      const atRiskCount = Math.max(0, (totalContacts ?? 0) - contactsWithRecentInteraction.size);

      // Generate highlights based on user settings
      const highlights: string[] = [];
      if (settings.include_performance_metrics !== false) {
        if ((totalInteractions ?? 0) > 10) {
          highlights.push(`Semana produtiva! Você teve ${totalInteractions} interações.`);
        }
        if ((newContactsCount ?? 0) > 0) {
          highlights.push(`${newContactsCount} novo(s) contato(s) adicionado(s).`);
        }
      }
      if (settings.include_upcoming_dates !== false && upcomingBirthdayCount > 0) {
        highlights.push(`${upcomingBirthdayCount} aniversário(s) esta semana.`);
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (settings.include_at_risk_clients !== false && atRiskCount > 5) {
        recommendations.push(`Atenção: ${atRiskCount} contatos sem interação há mais de 30 dias.`);
      }
      if (settings.include_recommendations !== false) {
        if ((pendingFollowUpsCount ?? 0) > 0) {
          recommendations.push(`Você tem ${pendingFollowUpsCount} follow-up(s) pendente(s).`);
        }
        if ((totalInteractions ?? 0) < 5) {
          recommendations.push('Considere aumentar a frequência de contato esta semana.');
        }
      }

      const digestData: WeeklyDigestData = {
        userId,
        email: settings.email_address || userData.user.email,
        firstName: profile.first_name || 'Usuário',
        stats: {
          totalInteractions: totalInteractions ?? 0,
          newContacts: newContactsCount ?? 0,
          upcomingBirthdays: upcomingBirthdayCount,
          atRiskContacts: atRiskCount,
          pendingFollowUps: pendingFollowUpsCount ?? 0,
        },
        highlights,
        recommendations,
      };

      digests.push(digestData);

      // Parallelize the two writes
      await Promise.all([
        supabase.from('weekly_reports').insert({
          user_id: userId,
          report_data: digestData,
          sent_via: ['system'],
        }),
        supabase.from('weekly_report_settings')
          .update({ last_sent_at: new Date().toISOString() })
          .eq('user_id', userId),
      ]);

      console.log(`Generated and saved report for user ${userId}`);
      } catch (userErr) {
        console.error(`weekly-digest error for user ${userId}:`, userErr);
        // Continue processing other users rather than failing the whole run
      }
    }

    console.log(`Generated ${digests.length} digests`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        digestsGenerated: digests.length,
        digests: digests 
      }),
      { 
        status: 200, 
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error generating weekly digest:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" }
      }
    );
  }
});

function generateEmailHtml(digest: WeeklyDigestData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .stat-label { font-size: 12px; color: #64748b; }
        .highlight { background: #dbeafe; padding: 10px 15px; border-radius: 8px; margin: 8px 0; }
        .recommendation { background: #fef3c7; padding: 10px 15px; border-radius: 8px; margin: 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Olá, ${digest.firstName}! 👋</h1>
          <p>Aqui está seu resumo semanal do SINGU</p>
        </div>
        <div class="content">
          <h2>📊 Esta Semana</h2>
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-value">${digest.stats.totalInteractions}</div>
              <div class="stat-label">Interações</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${digest.stats.newContacts}</div>
              <div class="stat-label">Novos Contatos</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${digest.stats.upcomingBirthdays}</div>
              <div class="stat-label">Aniversários</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${digest.stats.pendingFollowUps}</div>
              <div class="stat-label">Follow-ups</div>
            </div>
          </div>
          
          ${digest.highlights.length > 0 ? `
            <h3>✨ Destaques</h3>
            ${digest.highlights.map(h => `<div class="highlight">${h}</div>`).join('')}
          ` : ''}
          
          ${digest.recommendations.length > 0 ? `
            <h3>💡 Recomendações</h3>
            ${digest.recommendations.map(r => `<div class="recommendation">${r}</div>`).join('')}
          ` : ''}
          
          <p style="text-align: center; margin-top: 30px; color: #64748b;">
            Continue cultivando seus relacionamentos! 🌱
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
