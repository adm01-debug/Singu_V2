import { createClient } from "npm:@supabase/supabase-js@2";
import { sendResendEmail } from "../_shared/resend.ts";
import { guardBody, scopedCorsHeaders, requireCronSecret, authenticateRequest, jsonError } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const userLimiter = rateLimit({ windowMs: 60_000, max: 3 });
import { validate } from "../_shared/validate.ts";

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

  const caller = await authorizeCaller(req);
  if (caller instanceof Response) return caller;
  const authUserId = caller.userId;

  const { body: rawBody, error: bodyError } = await guardBody(req, 32 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const vwd = validate(rawBody ?? {}, {
      source: { type: 'string', maxLength: 20 },
      userId: { type: 'string', maxLength: 36 },
      sendEmail: { type: 'boolean' },
    });
    if (!vwd.ok) return new Response(JSON.stringify({ error: vwd.error }), { status: 400, headers: { ...scopedCorsHeaders(req), 'Content-Type': 'application/json' } });
    const { source, userId: bodyUserId, sendEmail } = vwd.data as { source?: string; userId?: string; sendEmail?: boolean };
    const specificUserId = authUserId ?? bodyUserId;
    const isCronJob = !authUserId && source === 'cron';
    const manualEmailKey = testEmailKey(authUserId, sendEmail);

    console.log(`Starting weekly digest generation... Source: ${isCronJob ? 'cron' : 'manual'}`);

    const now = new Date();
    // send_day/send_time são o horário de Brasília escolhido pelo usuário; o cron roda de hora em hora
    const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][brt.getDay()];
    const currentHour = brt.getHours();

    let settingsQuery = supabase.from('weekly_report_settings').select('*').eq('enabled', true);
    if (isCronJob) settingsQuery = settingsQuery.eq('send_day', currentDay);
    if (specificUserId) settingsQuery = settingsQuery.eq('user_id', specificUserId);

    const { data: reportSettings, error: settingsError } = await settingsQuery;
    if (settingsError) {
      console.error('Error fetching report settings:', settingsError);
      throw settingsError;
    }

    const eligibleSettings = isCronJob
      ? (reportSettings || []).filter(s => isDueNow(s, now, currentHour))
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
        const channel = await deliverDigest(digestData, emailTarget(isCronJob, manualEmailKey, settings.email_address), now, manualEmailKey);
        if (channel) {
          reportRows.push({ user_id: userId, report_data: digestData, sent_via: [channel] });
          successUserIds.push(userId);
        }
      } catch (userErr) {
        console.error(`weekly-digest error for user ${userId}:`, userErr);
      }
    }

    // --- BULK FLUSH ---
    const nowIso = now.toISOString();
    await Promise.all([
      reportRows.length > 0 ? supabase.from('weekly_reports').insert(reportRows) : Promise.resolve(),
      isCronJob && successUserIds.length > 0
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

/** Agendamento (x-cron-secret) processa os elegíveis; usuário logado (tela de relatório) só o próprio, até 3x/min. */
async function authorizeCaller(req: Request): Promise<{ userId: string | null } | Response> {
  if (req.headers.has('x-cron-secret')) return (await requireCronSecret(req)) ?? { userId: null };
  let userId: string;
  try { userId = await authenticateRequest(req); } catch { return jsonError('Unauthorized', 401, req); }
  return userLimiter.check(userId, req) ?? { userId };
}

/** Agendamento envia ao endereço configurado; pela tela, só quando o usuário pediu o e-mail de teste. */
function emailTarget(isCronJob: boolean, manualEmailKey: string | null, address: string | null | undefined): string | null {
  return isCronJob || manualEmailKey ? address ?? null : null;
}

/** Pela tela, e-mail só quando o usuário pede o teste; chave única por clique (o limite é 3/min). */
function testEmailKey(authUserId: string | null, sendEmail?: boolean): string | null {
  return authUserId && sendEmail ? `weekly-digest-teste-${authUserId}-${Date.now()}` : null;
}

/** Já passou da hora de envio (Brasília) no dia escolhido e não houve envio nas últimas 20 h.
 *  `>=` em vez de `===`: se o envio falhar, as execuções das horas seguintes do mesmo dia tentam de novo. */
function isDueNow(s: { send_time?: string | null; last_sent_at?: string | null }, now: Date, currentHour: number): boolean {
  if (s.last_sent_at && now.getTime() - new Date(s.last_sent_at).getTime() < 20 * 3_600_000) return false;
  const settingHour = s.send_time ? parseInt(s.send_time.split(':')[0], 10) : 9;
  return currentHour >= settingHour;
}

/** Canal usado ('email' | 'system') ou null quando o e-mail falhou — aí nada é gravado e a próxima
 *  execução do mesmo dia tenta de novo com a mesma Idempotency-Key. Sem endereço configurado = só no app. */
async function deliverDigest(digest: WeeklyDigestData, configuredEmail: string | null | undefined, now: Date, idempotencyKey: string | null = null): Promise<'email' | 'system' | null> {
  if (!configuredEmail) return 'system';
  try {
    const sent = await sendResendEmail({
      to: configuredEmail,
      subject: `Seu resumo semanal do Singu – ${now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      html: generateEmailHtml(digest),
      idempotencyKey: idempotencyKey ?? `weekly-digest-${digest.userId}-${now.toISOString().slice(0, 10)}`,
    });
    if (sent.ok) return 'email';
    console.error(`weekly-digest e-mail não enviado para ${digest.userId}:`, sent.error);
  } catch (err) {
    console.error(`weekly-digest falha de rede no e-mail para ${digest.userId}:`, err);
  }
  return null;
}

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
