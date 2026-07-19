import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if called from cron
    let requestBody: { source?: string; userId?: string } = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body, that's fine
    }

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

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', userId)
        .single();

      if (!profile) continue;

      // Get user's email from auth
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      
      if (!userData?.user?.email) continue;

      // Get interactions from last week
      const { data: interactions } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());

      // Get new contacts from last week
      const { data: newContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', oneWeekAgo.toISOString());

      // Get all contacts for analysis
      const { data: allContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId);

      // Check for upcoming birthdays (next 7 days)
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const upcomingBirthdays = (allContacts || []).filter(contact => {
        if (!contact.birthday) return false;
        const birthday = new Date(contact.birthday);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          birthday.getMonth(),
          birthday.getDate()
        );
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
      });

      // Get pending follow-ups
      const { data: pendingFollowUps } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', userId)
        .eq('follow_up_required', true)
        .lte('follow_up_date', new Date().toISOString());

      // Calculate at-risk contacts (no interaction in 30+ days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentInteractions } = await supabase
        .from('interactions')
        .select('contact_id')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const contactsWithRecentInteraction = new Set(
        recentInteractions?.map(i => i.contact_id) || []
      );
      
      const atRiskContacts = (allContacts || []).filter(
        c => !contactsWithRecentInteraction.has(c.id)
      );

      // Generate highlights based on user settings
      const highlights: string[] = [];
      if (settings.include_performance_metrics !== false) {
        if ((interactions?.length || 0) > 10) {
          highlights.push(`Semana produtiva! Você teve ${interactions?.length} interações.`);
        }
        if ((newContacts?.length || 0) > 0) {
          highlights.push(`${newContacts?.length} novo(s) contato(s) adicionado(s).`);
        }
      }
      if (settings.include_upcoming_dates !== false && upcomingBirthdays.length > 0) {
        highlights.push(`${upcomingBirthdays.length} aniversário(s) esta semana.`);
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (settings.include_at_risk_clients !== false && atRiskContacts.length > 5) {
        recommendations.push(`Atenção: ${atRiskContacts.length} contatos sem interação há mais de 30 dias.`);
      }
      if (settings.include_recommendations !== false) {
        if ((pendingFollowUps?.length || 0) > 0) {
          recommendations.push(`Você tem ${pendingFollowUps?.length} follow-up(s) pendente(s).`);
        }
        if ((interactions?.length || 0) < 5) {
          recommendations.push('Considere aumentar a frequência de contato esta semana.');
        }
      }

      const digestData: WeeklyDigestData = {
        userId,
        email: settings.email_address || userData.user.email,
        firstName: profile.first_name || 'Usuário',
        stats: {
          totalInteractions: interactions?.length || 0,
          newContacts: newContacts?.length || 0,
          upcomingBirthdays: upcomingBirthdays.length,
          atRiskContacts: atRiskContacts.length,
          pendingFollowUps: pendingFollowUps?.length || 0,
        },
        highlights,
        recommendations,
      };

      digests.push(digestData);

      // Save the report to history
      await supabase.from('weekly_reports').insert({
        user_id: userId,
        report_data: digestData,
        sent_via: ['system'],
      });

      // Update last_sent_at
      await supabase
        .from('weekly_report_settings')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('user_id', userId);

      console.log(`Generated and saved report for user ${userId}`);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
