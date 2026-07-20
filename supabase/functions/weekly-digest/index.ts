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

function countByUserId(rows: Array<{ user_id: string }> | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1);
  return m;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const cronError = await requireCronSecret(req);
  if (cronError) return cronError;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestBody = (rawBody as { source?: string; userId?: string }) ?? {};
    const isCronJob = requestBody.source === 'cron';
    const specificUserId = requestBody.userId;

    console.log(`Starting weekly digest generation... Source: ${isCronJob ? 'cron' : 'manual'}`);

    const now = new Date();
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getUTCDay()];
    const currentHour = now.getUTCHours();

    let settingsQuery = supabase.from('weekly_report_settings').select('*').eq('enabled', true);
    if (isCronJob) settingsQuery = settingsQuery.eq('send_day', currentDay);
    if (specificUserId) settingsQuery = settingsQuery.eq('user_id', specificUserId);

    const { data: reportSettings, error: settingsError } = await settingsQuery;
    if (settingsError) {
      console.error('Error fetching report settings:', settingsError);
      throw settingsError;
    }

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
        JSON.stringify({ success: true, message: 'No users eligible for report at this time', digestsGenerated: 0 }),
        { status: 200, headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const userIds = eligibleSettings.map((s: { user_id: string }) => s.user_id);
    const oneWeekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
    const nextWeek = new Date(now.getTime() + 7 * 86_400_000);

    // --- PRE-BATCH PHASE: all reads in one round-trip ---
    const [
      profilesResult,
      authUsersResult,
      weeklyInteractionsResult,
      newContactsResult,
      birthdayContactsResult,
      pendingFollowUpsResult,
      recentInteractionsResult,
      totalContactsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').in('id', userIds),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
      supabase.from('interactions').select('user_id').in('user_id', userIds).gte('created_at', oneWeekAgo.toISOString()).limit(100_000),
      supabase.from('contacts').select('user_id').in('user_id', userIds).gte('created_at', oneWeekAgo.toISOString()).limit(100_000),
      supabase.from('contacts').select('id, user_id, birthday').in('user_id', userIds).not('birthday', 'is', null).limit(100_000),
      supabase.from('interactions').select('user_id').in('user_id', userIds).eq('follow_up_required', true).lte('follow_up_date', now.toISOString()).limit(100_000),
      supabase.from('interactions').select('user_id, contact_id').in('user_id', userIds).gte('created_at', thirtyDaysAgo.toISOString()).limit(100_000),
      supabase.from('contacts').select('user_id').in('user_id', userIds).limit(100_000),
    ]);

    type ProfileRow = { id: string; first_name: string | null; last_name: string | null };
    const profilesByUser = new Map<string, ProfileRow>();
    for (const p of (profilesResult.data ?? []) as ProfileRow[]) profilesByUser.set(p.id, p);

    const authEmailByUser = new Map<string, string>();
    for (const u of authUsersResult.data?.users ?? []) {
      if (u.email) authEmailByUser.set(u.id, u.email);
    }

    const weeklyInteractionsByUser = countByUserId(weeklyInteractionsResult.data as Array<{ user_id: string }> | null);
    const newContactsByUser = countByUserId(newContactsResult.data as Array<{ user_id: string }> | null);
    const pendingFollowUpsByUser = countByUserId(pendingFollowUpsResult.data as Array<{ user_id: string }> | null);
    const totalContactsByUser = countByUserId(totalContactsResult.data as Array<{ user_id: string }> | null);

    type BirthdayRow = { id: string; user_id: string; birthday: string };
    const birthdaysByUser = new Map<string, BirthdayRow[]>();
    for (const c of (birthdayContactsResult.data ?? []) as BirthdayRow[]) {
      const arr = birthdaysByUser.get(c.user_id) ?? [];
      arr.push(c);
      birthdaysByUser.set(c.user_id, arr);
    }

    type RecentRow = { user_id: string; contact_id: string };
    const recentContactsByUser = new Map<string, Set<string>>();
    for (const r of (recentInteractionsResult.data ?? []) as RecentRow[]) {
      const s = recentContactsByUser.get(r.user_id) ?? new Set<string>();
      s.add(r.contact_id);
      recentContactsByUser.set(r.user_id, s);
    }

    // --- COMPUTATION LOOP (pure in-memory, no DB calls) ---
    const digests: WeeklyDigestData[] = [];
    const reportRows: Array<Record<string, unknown>> = [];
    const successUserIds: string[] = [];

    for (const settings of eligibleSettings) {
      const userId = settings.user_id;
      try {
        const profile = profilesByUser.get(userId);
        const email = settings.email_address || authEmailByUser.get(userId);
        if (!profile || !email) continue;

        const birthdayContacts = birthdaysByUser.get(userId) ?? [];
        const upcomingBirthdayCount = birthdayContacts.filter(contact => {
          const birthday = new Date(contact.birthday);
          const thisYearBirthday = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
          return thisYearBirthday >= now && thisYearBirthday <= nextWeek;
        }).length;

        const totalContacts = totalContactsByUser.get(userId) ?? 0;
        const recentContactSet = recentContactsByUser.get(userId) ?? new Set<string>();
        const atRiskCount = Math.max(0, totalContacts - recentContactSet.size);

        const totalInteractions = weeklyInteractionsByUser.get(userId) ?? 0;
        const newContactsCount = newContactsByUser.get(userId) ?? 0;
        const pendingFollowUpsCount = pendingFollowUpsByUser.get(userId) ?? 0;

        const highlights: string[] = [];
        if (settings.include_performance_metrics !== false) {
          if (totalInteractions > 10) highlights.push(`Semana produtiva! Você teve ${totalInteractions} interações.`);
          if (newContactsCount > 0) highlights.push(`${newContactsCount} novo(s) contato(s) adicionado(s).`);
        }
        if (settings.include_upcoming_dates !== false && upcomingBirthdayCount > 0) {
          highlights.push(`${upcomingBirthdayCount} aniversário(s) esta semana.`);
        }

        const recommendations: string[] = [];
        if (settings.include_at_risk_clients !== false && atRiskCount > 5) {
          recommendations.push(`Atenção: ${atRiskCount} contatos sem interação há mais de 30 dias.`);
        }
        if (settings.include_recommendations !== false) {
          if (pendingFollowUpsCount > 0) recommendations.push(`Você tem ${pendingFollowUpsCount} follow-up(s) pendente(s).`);
          if (totalInteractions < 5) recommendations.push('Considere aumentar a frequência de contato esta semana.');
        }

        const digestData: WeeklyDigestData = {
          userId,
          email,
          firstName: profile.first_name || 'Usuário',
          stats: { totalInteractions, newContacts: newContactsCount, upcomingBirthdays: upcomingBirthdayCount, atRiskContacts: atRiskCount, pendingFollowUps: pendingFollowUpsCount },
          highlights,
          recommendations,
        };

        digests.push(digestData);
        reportRows.push({ user_id: userId, report_data: digestData, sent_via: ['system'] });
        successUserIds.push(userId);
      } catch (userErr) {
        console.error(`weekly-digest error for user ${userId}:`, userErr);
      }
    }

    // --- BULK FLUSH ---
    const nowIso = now.toISOString();
    await Promise.all([
      reportRows.length > 0 ? supabase.from('weekly_reports').insert(reportRows) : Promise.resolve(),
      successUserIds.length > 0
        ? supabase.from('weekly_report_settings').update({ last_sent_at: nowIso }).in('user_id', successUserIds)
        : Promise.resolve(),
    ]);

    console.log(`Generated ${digests.length} digests`);

    return new Response(
      JSON.stringify({ success: true, digestsGenerated: digests.length, digests }),
      { status: 200, headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating weekly digest:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...scopedCorsHeaders(req), "Content-Type": "application/json" } }
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
