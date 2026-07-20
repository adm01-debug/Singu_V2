import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuthOrServiceRole, isServiceRoleCaller, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { fetchAI } from "../_shared/fetch-utils.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Muitas solicitações de lembretes. Aguarde antes de tentar novamente." });

interface SmartReminder {
  id: string;
  type: 'follow_up' | 'birthday' | 'decay' | 'milestone' | 'nba_escalation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  contactId: string;
  contactName: string;
  dueDate: string | null;
  metadata: Record<string, unknown>;
}

type DecayLevel = 'warming' | 'cooling' | 'cold' | 'frozen';

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const authResult = await withAuthOrServiceRole(req);
  if (authResult instanceof Response) return authResult;

  if (!isServiceRoleCaller(authResult)) {
    const limited = limiter.check(authResult, req);
    if (limited) return limited;
  }

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const body = (rawBody ?? {}) as Record<string, unknown>;

    let userId: string;
    if (isServiceRoleCaller(authResult)) {
      if (!body.userId || typeof body.userId !== 'string') return jsonError('userId required for service-role calls', 400);
      userId = body.userId;
    } else {
      userId = authResult;
    }

    const action = body.action as string | undefined;

    const db = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUpEnd = new Date(today.getTime() + 3 * 86_400_000);
    const since30d = new Date(today.getTime() - 30 * 86_400_000).toISOString();
    // fetch recent interactions far enough back to cover the worst-case decay window (60d)
    const since60d = new Date(today.getTime() - 60 * 86_400_000).toISOString();

    // ── Parallelize all 6 top-level independent reads ──────────────────────
    const [
      { data: followUps },
      { data: contactsWithBirthday },
      { data: lifeEvents },
      { data: allContacts },
      { data: pendingNBA },
      { data: recentInteractions },
      { data: latestInteractionsRaw },
    ] = await Promise.all([
      // 1. Follow-ups (next 3 days)
      db.from('interactions')
        .select('id, title, content, follow_up_date, contact_id, contacts:contact_id(id, first_name, last_name)')
        .eq('user_id', userId)
        .eq('follow_up_required', true)
        .gte('follow_up_date', today.toISOString().split('T')[0])
        .lte('follow_up_date', followUpEnd.toISOString().split('T')[0])
        .order('follow_up_date', { ascending: true }),

      // 2a. Contacts with birthdays
      db.from('contacts')
        .select('id, first_name, last_name, birthday, relationship_score')
        .eq('user_id', userId)
        .not('birthday', 'is', null),

      // 2b. Life events
      db.from('life_events')
        .select('id, title, event_date, event_type, contact_id, recurring, reminder_days_before, contacts:contact_id(first_name, last_name, relationship_score)')
        .eq('user_id', userId),

      // 3. All contacts for decay detection (only needed fields)
      db.from('contacts')
        .select('id, first_name, last_name, relationship_score, relationship_stage')
        .eq('user_id', userId),

      // 4. Pending NBAs
      db.from('contact_next_actions')
        .select('id, action, urgency, generated_at, contact_id, contacts:contact_id(id, first_name, last_name)')
        .eq('user_id', userId)
        .eq('status', 'pending'),

      // 5. Recent interactions (milestones, last 30d)
      db.from('interactions')
        .select('id, title, type, contact_id, created_at, contacts:contact_id(id, first_name, last_name, relationship_score)')
        .eq('user_id', userId)
        .gte('created_at', since30d)
        .order('created_at', { ascending: false }),

      // 3-fix: latest interaction per contact (replaces N+1 per-contact query)
      db.from('interactions')
        .select('contact_id, created_at')
        .eq('user_id', userId)
        .gte('created_at', since60d)
        .order('created_at', { ascending: false })
        .limit(10000),
    ]);

    // Build latest-interaction map: contact_id → most-recent created_at
    const latestByContact = new Map<string, Date>();
    for (const row of latestInteractionsRaw ?? []) {
      const existing = latestByContact.get(row.contact_id);
      const ts = new Date(row.created_at);
      if (!existing || ts > existing) latestByContact.set(row.contact_id, ts);
    }

    // Batch-fetch NBA automation settings in one query instead of N queries
    const nbaContactIds = (pendingNBA ?? []).map((a: { contact_id: string }) => a.contact_id);
    const { data: allSettings } = nbaContactIds.length > 0
      ? await db.from('contact_automation_settings')
          .select('contact_id, escalation_enabled, delay_hours, reminder_enabled')
          .in('contact_id', nbaContactIds)
      : { data: [] };
    const settingsByContact = new Map(
      (allSettings ?? []).map((s: { contact_id: string; escalation_enabled: boolean; delay_hours: number; reminder_enabled: boolean }) => [s.contact_id, s])
    );

    const reminders: SmartReminder[] = [];

    // ── 1. Follow-ups ───────────────────────────────────────────────────────
    for (const followUp of followUps ?? []) {
      const contactData = followUp.contacts;
      const contact = Array.isArray(contactData) ? contactData[0] : contactData;
      const contactName = contact ? `${(contact as Record<string, string>).first_name} ${(contact as Record<string, string>).last_name}` : 'Contato';
      const followUpDate = new Date(followUp.follow_up_date);
      const isToday = followUpDate.toDateString() === today.toDateString();
      const isTomorrow = followUpDate.toDateString() === new Date(today.getTime() + 86_400_000).toDateString();
      reminders.push({
        id: `followup-${followUp.id}`,
        type: 'follow_up',
        priority: isToday ? 'high' : (isTomorrow ? 'medium' : 'low'),
        title: isToday ? `📅 Follow-up Hoje: ${followUp.title}` :
               isTomorrow ? `📅 Follow-up Amanhã: ${followUp.title}` :
               `📅 Follow-up Próximo: ${followUp.title}`,
        description: `Acompanhamento agendado com ${contactName}`,
        contactId: followUp.contact_id,
        contactName,
        dueDate: followUp.follow_up_date,
        metadata: { interactionId: followUp.id, content: followUp.content },
      });
    }

    // ── 2a. Legacy Contact Birthdays ────────────────────────────────────────
    for (const contact of contactsWithBirthday ?? []) {
      if (!contact.birthday) continue;
      const bday = new Date(contact.birthday);
      const checkDate = new Date(today);
      for (let i = 0; i <= 7; i++) {
        const cur = new Date(checkDate);
        if (bday.getMonth() === cur.getMonth() && bday.getDate() === cur.getDate()) {
          const contactName = `${contact.first_name} ${contact.last_name}`;
          reminders.push({
            id: `legacy-bday-${contact.id}`,
            type: 'birthday',
            priority: i <= 1 ? 'high' : 'medium',
            title: i === 0 ? `🎂 Aniversário Hoje: ${contactName}` : `🎂 Aniversário em breve: ${contactName}`,
            description: i === 0 ? 'Envie os parabéns!' : `Aniversário em ${i} dias.`,
            contactId: contact.id,
            contactName,
            dueDate: cur.toISOString().split('T')[0],
            metadata: { daysUntil: i, relationshipScore: contact.relationship_score },
          });
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
    }

    // ── 2b. Life Events ─────────────────────────────────────────────────────
    for (const event of lifeEvents ?? []) {
      const contactData = Array.isArray(event.contacts) ? event.contacts[0] : event.contacts;
      if (!contactData) continue;
      const contactName = `${contactData.first_name} ${contactData.last_name}`;
      const eventDate = new Date(event.event_date);
      const reminderDays = event.reminder_days_before || 7;
      const nextDate = new Date(eventDate);
      if (event.recurring) {
        nextDate.setFullYear(today.getFullYear());
        if (nextDate < today) nextDate.setFullYear(today.getFullYear() + 1);
      }
      const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / 86_400_000);
      if (diffDays >= 0 && diffDays <= reminderDays) {
        const emojiMap: Record<string, string> = {
          birthday: '🎂', anniversary: '💍', promotion: '📈',
          travel: '✈️', family: '👨‍👩‍👧‍👦', achievement: '🏆', other: '✨',
        };
        reminders.push({
          id: `life-event-${event.id}`,
          type: 'milestone',
          priority: diffDays <= 1 ? 'high' : (diffDays <= 3 ? 'medium' : 'low'),
          title: `${emojiMap[event.event_type] || '📅'} ${event.title}: ${contactName}`,
          description: diffDays === 0 ? 'Acontece hoje!' : `Em ${diffDays} dias.`,
          contactId: event.contact_id,
          contactName,
          dueDate: nextDate.toISOString().split('T')[0],
          metadata: { eventType: event.event_type, daysUntil: diffDays, relationshipScore: contactData.relationship_score },
        });
      }
    }

    // ── 3. Relationship Decay (fixed: no N+1 — uses latestByContact map) ───
    for (const contact of allContacts ?? []) {
      const lastInteractionDate = latestByContact.get(contact.id);
      if (!lastInteractionDate) continue;

      const daysSince = Math.floor((today.getTime() - lastInteractionDate.getTime()) / 86_400_000);
      const relScore = contact.relationship_score || 50;
      const decayThreshold = relScore >= 70 ? 14 : relScore >= 50 ? 21 : 30;

      let decayLevel: DecayLevel = 'warming';
      let priority: SmartReminder['priority'] = 'low';
      let shouldAlert = false;

      if (daysSince >= decayThreshold * 2) { decayLevel = 'frozen'; priority = 'high'; shouldAlert = true; }
      else if (daysSince >= decayThreshold * 1.5) { decayLevel = 'cold'; priority = 'high'; shouldAlert = true; }
      else if (daysSince >= decayThreshold) { decayLevel = 'cooling'; priority = 'medium'; shouldAlert = true; }
      else if (daysSince >= decayThreshold * 0.75 && relScore >= 70) { shouldAlert = true; }

      if (shouldAlert) {
        const contactName = `${contact.first_name} ${contact.last_name}`;
        const emojiMap: Record<DecayLevel, string> = { frozen: '🥶', cold: '❄️', cooling: '🌡️', warming: '💛' };
        const descMap: Record<DecayLevel, string> = {
          frozen: `Reconecte-se urgentemente! ${daysSince} dias sem contato.`,
          cold: `Relacionamento esfriando. Última interação há ${daysSince} dias.`,
          cooling: `Considere fazer um check-in. ${daysSince} dias desde o último contato.`,
          warming: `Mantenha o momentum. ${daysSince} dias desde a última interação.`,
        };
        reminders.push({
          id: `decay-${contact.id}`, type: 'decay', priority,
          title: `${emojiMap[decayLevel]} Relacionamento Esfriando: ${contactName}`,
          description: descMap[decayLevel],
          contactId: contact.id, contactName, dueDate: null,
          metadata: { daysSinceLastInteraction: daysSince, decayLevel, relationshipScore: relScore, relationshipStage: contact.relationship_stage },
        });
      }
    }

    // ── 4. NBA Escalations (fixed: no N+1 — uses settingsByContact map) ────
    for (const action of pendingNBA ?? []) {
      const settings = settingsByContact.get(action.contact_id);
      if (!settings) continue;

      const generatedAt = new Date(action.generated_at);
      const delayHours = settings.delay_hours || 24;
      const deadline = new Date(generatedAt.getTime() + delayHours * 3_600_000);
      const isOverdue = today > deadline;
      const contactData = Array.isArray(action.contacts) ? action.contacts[0] : action.contacts;
      const contactName = contactData ? `${(contactData as Record<string, string>).first_name} ${(contactData as Record<string, string>).last_name}` : 'Contato';

      if (isOverdue && settings.escalation_enabled) {
        reminders.push({
          id: `nba-esc-${action.id}`,
          type: 'nba_escalation',
          priority: 'high',
          title: `🚨 ESCALONADO: ${action.action}`,
          description: `Ação sugerida para ${contactName} está atrasada há mais de ${delayHours}h.`,
          contactId: action.contact_id,
          contactName,
          dueDate: deadline.toISOString(),
          metadata: { nbaId: action.id, delayHours, urgency: action.urgency },
        });
      } else if (settings.reminder_enabled && action.urgency === 'high') {
        reminders.push({
          id: `nba-rem-${action.id}`,
          type: 'follow_up',
          priority: 'medium',
          title: `⚡ Lembrete: ${action.action}`,
          description: `Próximo passo recomendado para ${contactName}`,
          contactId: action.contact_id,
          contactName,
          dueDate: generatedAt.toISOString(),
          metadata: { nbaId: action.id },
        });
      }
    }

    // ── 5. Milestones ───────────────────────────────────────────────────────
    const interactionCounts = new Map<string, number>();
    for (const interaction of recentInteractions ?? []) {
      interactionCounts.set(interaction.contact_id, (interactionCounts.get(interaction.contact_id) || 0) + 1);
    }
    for (const [contactId, count] of interactionCounts) {
      if (count >= 10) {
        const interaction = recentInteractions!.find(i => i.contact_id === contactId);
        const contact = Array.isArray(interaction?.contacts) ? interaction?.contacts[0] : interaction?.contacts;
        if (contact) {
          const cd = contact as Record<string, unknown>;
          reminders.push({
            id: `milestone-${contactId}`, type: 'milestone', priority: 'low',
            title: `🌟 Relacionamento Forte: ${cd.first_name} ${cd.last_name}`,
            description: `${count} interações nos últimos 30 dias. Continue assim!`,
            contactId, contactName: `${cd.first_name} ${cd.last_name}`, dueDate: null,
            metadata: { interactionCount: count, relationshipScore: cd.relationship_score },
          });
        }
      }
    }

    // Sort by priority then dueDate
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    reminders.sort((a, b) => {
      const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (diff !== 0) return diff;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });

    // AI insights for decay (optional)
    let aiInsights = null;
    if (action === 'analyze') {
      const decayReminders = reminders.filter(r => r.type === 'decay');
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY && decayReminders.length > 0) {
        try {
          const lines = decayReminders.slice(0, 5).map(r =>
            `- ${r.contactName}: ${r.description}\n  - Score: ${r.metadata.relationshipScore}\n  - Dias sem contato: ${r.metadata.daysSinceLastInteraction}`
          ).join('\n');
          const resp = await fetchAI('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: 'Você é um especialista em gestão de relacionamentos profissionais. Forneça insights práticos e acionáveis.' },
                { role: 'user', content: `Analise estes relacionamentos que estão esfriando e sugira ações específicas:\n\n${lines}` },
              ],
              max_tokens: 500,
            }),
          });
          if (resp.ok) {
            const data = await resp.json();
            aiInsights = data.choices?.[0]?.message?.content;
          }
        } catch (err) {
          console.error('Error getting AI insights:', err);
        }
      }
    }

    const summary = {
      total: reminders.length,
      byType: {
        follow_up: reminders.filter(r => r.type === 'follow_up').length,
        birthday: reminders.filter(r => r.type === 'birthday').length,
        decay: reminders.filter(r => r.type === 'decay').length,
        milestone: reminders.filter(r => r.type === 'milestone').length,
      },
      byPriority: {
        high: reminders.filter(r => r.priority === 'high').length,
        medium: reminders.filter(r => r.priority === 'medium').length,
        low: reminders.filter(r => r.priority === 'low').length,
      },
    };

    return jsonOk({ success: true, reminders, summary, aiInsights }, req);
  } catch (error: unknown) {
    console.error('Smart Reminders Error:', error);
    return jsonError(error instanceof Error ? error.message : 'Unknown error', 500, req);
  }
});
