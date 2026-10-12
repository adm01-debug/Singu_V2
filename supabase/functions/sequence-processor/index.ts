// Sequence Processor — cron a cada 5min
// Avança enrollments, avalia branching condicional, envia emails e respeita pause-on-reply
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { scopedCorsHeaders, requireCronSecret, withAuthOrServiceRole, isServiceRoleCaller } from "../_shared/auth.ts";

interface Step {
  id: string;
  sequence_id: string;
  step_order: number;
  channel: string;
  delay_days: number;
  delay_hours: number;
  subject: string | null;
  message_template: string | null;
  condition_type: string;
  condition_wait_hours: number;
  branch_on_yes_step: number | null;
  branch_on_no_step: number | null;
}

interface Enrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  user_id: string;
  status: string;
  current_step: number | null;
  next_action_at: string | null;
  enrolled_at: string;
  replied_at: string | null;
  last_step_executed_at: string | null;
  metadata?: Record<string, unknown> | null;
}

interface SendLogEntry {
  enrollment_id: string;
  step_order: number;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  status: string;
  message_id: string | null;
}

interface Contact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface EmailResult {
  sent: boolean;
  advanced: boolean;
  paused: boolean;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  let userId: string | null = null;
  if (req.headers.has('x-cron-secret')) {
    const cronCheck = await requireCronSecret(req);
    if (cronCheck) return cronCheck;
  } else {
    const auth = await withAuthOrServiceRole(req);
    if (auth instanceof Response) return auth;
    if (isServiceRoleCaller(auth)) {
      const cronCheck = await requireCronSecret(req);
      if (cronCheck) return cronCheck;
    } else userId = auth;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();
  const stats = { processed: 0, sent: 0, advanced: 0, paused: 0, completed: 0, errors: 0 };

  try {
    // 1. Buscar enrollments ativos com next_action_at vencido
    let enrollmentQuery = supabase
      .from('sequence_enrollments')
      .select('*, sequences!inner(status)')
      .eq('status', 'active')
      .eq('sequences.status', 'active')
      .lte('next_action_at', now.toISOString())
      .order('next_action_at', { ascending: true })
      .limit(100);
    if (userId) enrollmentQuery = enrollmentQuery.eq('user_id', userId);
    const { data: enrollments, error: enrErr } = await enrollmentQuery;

    if (enrErr) throw enrErr;
    if (!enrollments || enrollments.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'Nada a processar', stats }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Pre-batch: eliminate N+1 — fetch all needed data in 5 queries instead of up to 500
    const enrList = enrollments as Enrollment[];
    const enrollmentIds = enrList.map(e => e.id);
    const sequenceIds = [...new Set(enrList.map(e => e.sequence_id))];
    const contactIds = [...new Set(enrList.map(e => e.contact_id))];

    const [
      { data: sequenceRows, error: sequenceError },
      { data: allStepsRows, error: stepsError },
      { data: replyEventRows, error: replyError },
      { data: sendLogRows, error: sendLogError },
      { data: contactRows, error: contactError },
    ] = await Promise.all([
      supabase.from('sequences').select('id, user_id, status, pause_on_reply, pause_on_meeting').in('id', sequenceIds),
      supabase.from('sequence_steps').select('*').in('sequence_id', sequenceIds).order('step_order'),
      supabase.from('sequence_events').select('enrollment_id').in('enrollment_id', enrollmentIds).eq('event_type', 'replied'),
      fetchSendLogs(supabase, enrollmentIds),
      supabase.from('contacts').select('id, user_id, first_name, last_name, email').in('id', contactIds),
    ]);
    if (sequenceError || stepsError || replyError || sendLogError || contactError) {
      throw sequenceError || stepsError || replyError || sendLogError || contactError;
    }

    // Build in-memory lookup structures
    const sequenceMap = new Map(
      (sequenceRows ?? []).map((s: { id: string; user_id: string; status: string; pause_on_reply: boolean; pause_on_meeting: boolean }) => [s.id, s])
    );

    const stepsBySeqId = new Map<string, Step[]>();
    for (const step of (allStepsRows ?? []) as Step[]) {
      const arr = stepsBySeqId.get(step.sequence_id) ?? [];
      arr.push(step);
      stepsBySeqId.set(step.sequence_id, arr);
    }

    // Set of enrollment IDs that have a replied event
    const enrollmentsWithReply = new Set(
      (replyEventRows ?? []).map((e: { enrollment_id: string }) => e.enrollment_id)
    );

    // enrollment_id -> step_order -> send log entry
    const sendLogByEnrollment = new Map<string, Map<number, SendLogEntry>>();
    for (const log of (sendLogRows ?? []) as SendLogEntry[]) {
      if (log.status === 'bounced' && !log.message_id) continue;
      const inner = sendLogByEnrollment.get(log.enrollment_id) ?? new Map<number, SendLogEntry>();
      inner.set(log.step_order, log);
      sendLogByEnrollment.set(log.enrollment_id, inner);
    }

    const contactMap = new Map(
      (contactRows ?? []).map((c: Contact) => [c.id, c])
    );

    // Bulk-write accumulators — populate in pure computation loop, flush in parallel after
    type EnrRow = { id: string; [key: string]: unknown };
    const repliedRows: EnrRow[] = [];
    const pausedRows: EnrRow[] = [];
    const completedRows: EnrRow[] = [];
    const waitRows: EnrRow[] = [];
    type EmailJob = { enr: Enrollment; step: Step; contact: Contact | null; nextAction: string | null; log?: SendLogEntry };
    const emailJobs: EmailJob[] = [];

    for (const enr of enrList) {
      stats.processed++;
      try {
        const seq = sequenceMap.get(enr.sequence_id);
        if (!seq || seq.user_id !== enr.user_id) throw new Error('Inscrição não pertence ao proprietário da sequência');
        if (seq.status !== 'active') continue;

        // 2. Pause-on-reply: se contato respondeu, pausa (Map lookup, no DB call)
        if (seq?.pause_on_reply) {
          if (enrollmentsWithReply.has(enr.id) || enr.replied_at) {
            repliedRows.push({ id: enr.id, status: 'replied', replied_at: enr.replied_at ?? now.toISOString() });
            continue;
          }
        }

        // 3. Steps from Map — no DB call
        const steps = stepsBySeqId.get(enr.sequence_id) ?? [];

        if (steps.length === 0) {
          completedRows.push({ id: enr.id, status: 'completed', completed_at: now.toISOString() });
          continue;
        }

        const currentStep = enr.current_step ?? 0;
        const nextStepOrder = currentStep + 1;
        let targetStep = steps.find((s) => s.step_order === nextStepOrder);

        // 4. Avaliar branching do step ANTERIOR — in-memory, no DB call
        if (currentStep > 0) {
          const prevStep = steps.find((s) => s.step_order === currentStep);
          if (prevStep && prevStep.condition_type !== 'always') {
            const sendLog = sendLogByEnrollment.get(enr.id)?.get(prevStep.step_order);
            const conditionMet = evaluateConditionInMemory(enr.id, prevStep, sendLog, enrollmentsWithReply);
            if (conditionMet === null) {
              const waitUntil = new Date(
                new Date(sendLog?.sent_at ?? enr.last_step_executed_at ?? enr.enrolled_at).getTime() +
                  prevStep.condition_wait_hours * 3600_000,
              );
              waitRows.push({ id: enr.id, next_action_at: waitUntil.toISOString() });
              continue;
            }
            const branchTo = conditionMet ? prevStep.branch_on_yes_step : prevStep.branch_on_no_step;
            if (branchTo !== null && branchTo !== undefined) {
              targetStep = steps.find((s) => s.step_order === branchTo);
            }
          }
        }

        if (!targetStep) {
          completedRows.push({ id: enr.id, status: 'completed', completed_at: now.toISOString() });
          continue;
        }

        // 5. Calcular próximo next_action_at (needed for both email and non-email advance)
        const upcomingStep = steps.find((s) => s.step_order === targetStep!.step_order + 1);
        let nextAction: string | null = null;
        if (upcomingStep) {
          const delayMs =
            (upcomingStep.delay_days * 86400 + upcomingStep.delay_hours * 3600) * 1000;
          nextAction = new Date(now.getTime() + delayMs).toISOString();
        }

        // 6. Accumulate work per channel
        if (targetStep.channel === 'email') {
          const log = sendLogByEnrollment.get(enr.id)?.get(targetStep.step_order);
          if (log?.status === 'bounced') {
            pausedRows.push({ id: enr.id, status: 'paused', paused_at: now.toISOString(), paused_reason: 'Envio devolvido; revise o endereço antes de retomar' });
            stats.errors++;
            continue;
          }
          emailJobs.push({ enr, step: targetStep, contact: contactMap.get(enr.contact_id) ?? null, nextAction, log });
        } else {
          pausedRows.push({
            id: enr.id,
            status: 'paused',
            paused_at: now.toISOString(),
            paused_reason: `Canal ${targetStep.channel} sem confirmação de execução`,
            metadata: {
              ...(enr.metadata ?? {}),
              pending_manual_step: { step_id: targetStep.id, step_order: targetStep.step_order, channel: targetStep.channel },
            },
          });
          stats.errors++;
        }
      } catch (e) {
        console.error(`Erro enrollment ${enr.id}:`, e);
        stats.errors++;
      }
    }

    // Envio de email e atualização da inscrição dependem da confirmação do provedor.
    const emailResults = await Promise.allSettled(
      emailJobs.map((job) => sendEmailStep(supabase, job.enr, job.step, job.contact, job.nextAction, job.log))
    );
    for (const [index, result] of emailResults.entries()) {
      if (result.status === 'fulfilled' && result.value.sent) stats.sent++;
      if (result.status === 'fulfilled' && result.value.paused) stats.paused++;
      if (result.status === 'fulfilled' && result.value.advanced) {
        stats.advanced++;
        if (!emailJobs[index].nextAction) stats.completed++;
      }
      else stats.errors++;
    }

    const originalSteps = new Map(enrList.map(enr => [enr.id, enr.current_step]));
    const groups: Array<{ rows: EnrRow[]; stat: 'paused' | 'completed' | null }> = [
      { rows: repliedRows, stat: 'paused' },
      { rows: pausedRows, stat: 'paused' },
      { rows: completedRows, stat: 'completed' },
      { rows: waitRows, stat: null },
    ];
    for (const group of groups) {
      for (let offset = 0; offset < group.rows.length; offset += 10) {
        const writes = await Promise.all(group.rows.slice(offset, offset + 10).map(row => {
          const update = supabase.from('sequence_enrollments').update(row).eq('id', row.id).eq('status', 'active');
          const step = originalSteps.get(row.id);
          return (step === null || step === undefined ? update.is('current_step', null) : update.eq('current_step', step))
            .select('id').maybeSingle();
        }));
        for (const write of writes) {
          if (write.error) throw write.error;
          if (!write.data) stats.errors++;
          else if (group.stat) stats[group.stat]++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: stats.errors === 0, stats }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Sequence processor fatal:', e);
    return new Response(JSON.stringify({ ok: false, error: 'Internal server error', stats }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

// Pure in-memory condition evaluation — no DB calls, uses pre-fetched Maps
async function fetchSendLogs(supabase: SupabaseClient, enrollmentIds: string[]) {
  const pageSize = 1000;
  const rows: SendLogEntry[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('sequence_send_log')
      .select('enrollment_id, step_order, sent_at, opened_at, clicked_at, status, message_id')
      .in('enrollment_id', enrollmentIds).in('status', ['sent', 'bounced'])
      .order('sent_at', { ascending: true }).order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...((data ?? []) as SendLogEntry[]));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}

function evaluateConditionInMemory(
  enrollmentId: string,
  step: Step,
  sendLog: SendLogEntry | undefined,
  enrollmentsWithReply: Set<string>,
): boolean | null {
  if (!sendLog) return false;
  const elapsed = (Date.now() - new Date(sendLog.sent_at).getTime()) / 3600_000;
  if (elapsed < step.condition_wait_hours) return null;

  switch (step.condition_type) {
    case 'if_opened':     return !!sendLog.opened_at;
    case 'if_not_opened': return !sendLog.opened_at;
    case 'if_clicked':    return !!sendLog.clicked_at;
    case 'if_replied':    return enrollmentsWithReply.has(enrollmentId);
    case 'if_not_replied':return !enrollmentsWithReply.has(enrollmentId);
    default:              return true;
  }
}

async function sendEmailStep(
  supabase: SupabaseClient,
  enr: Enrollment,
  step: Step,
  contact: Contact | null,
  nextAction: string | null,
  confirmedLog?: SendLogEntry,
): Promise<EmailResult> {
  let accepted = !!confirmedLog?.message_id;
  let newlySent = false;
  try {
    if (!contact || contact.user_id !== enr.user_id) throw new Error('Contato não pertence ao proprietário da inscrição');
    if (confirmedLog && !confirmedLog.message_id) throw new Error('Envio anterior sem confirmação do provedor; revise antes de retomar');

    const idempotencyKey = `seq-${enr.id}-step-${step.step_order}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(idempotencyKey));
    const trackingToken = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
    if (confirmedLog) {
      await completeEmailDelivery(supabase, enr, step, nextAction, confirmedLog.message_id!, trackingToken, null);
      return { sent: false, advanced: true, paused: false };
    }
    if (!contact.email) throw new Error('Contato sem email');
    const body = (step.message_template ?? '')
      .replaceAll('{{first_name}}', contact.first_name ?? '')
      .replaceAll('{{last_name}}', contact.last_name ?? '');
    const subject = (step.subject ?? 'Mensagem')
      .replaceAll('{{first_name}}', contact.first_name ?? '');

    const { data: delivery, error: deliveryError } = await supabase.functions.invoke<{ ok: boolean; messageId: string }>('send-transactional-email', {
      signal: AbortSignal.timeout(20_000),
      body: {
        templateName: 'sequence-step',
        recipientEmail: contact.email,
        idempotencyKey,
        templateData: { subject, body, trackingToken },
      },
    });
    if (deliveryError || delivery?.ok !== true || typeof delivery.messageId !== 'string' || !delivery.messageId.trim()) {
      throw new Error('Envio transacional não confirmado pelo provedor');
    }
    accepted = true;
    newlySent = true;

    await completeEmailDelivery(supabase, enr, step, nextAction, delivery.messageId, trackingToken, subject);
    return { sent: newlySent, advanced: true, paused: false };
  } catch (e) {
    console.error('sendEmailStep erro:', e);
    const pause = supabase.from('sequence_enrollments').update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      paused_reason: accepted ? 'Provedor confirmou o envio; persistência ou avanço exigem revisão' : 'Envio não confirmado; revise a integração antes de retomar',
    })
      .eq('id', enr.id).eq('status', 'active');
    const { data: paused, error: pauseError } = await (enr.current_step === null
      ? pause.is('current_step', null)
      : pause.eq('current_step', enr.current_step)).select('id').maybeSingle();
    if (pauseError) console.error('Não foi possível pausar a inscrição:', pauseError);
    if (!accepted) {
      const { error: failureError } = await supabase.from('sequence_send_log').insert({
        enrollment_id: enr.id,
        step_id: step.id,
        sequence_id: enr.sequence_id,
        contact_id: enr.contact_id,
        user_id: enr.user_id,
        step_order: step.step_order,
        channel: 'email',
        status: 'failed',
        error_message: e instanceof Error ? e.message : 'Envio não confirmado',
      });
      if (failureError) console.error('Não foi possível registrar a falha:', failureError);
    }
    return { sent: newlySent, advanced: false, paused: !!paused && !pauseError };
  }
}

async function completeEmailDelivery(
  supabase: SupabaseClient, enr: Enrollment, step: Step, nextAction: string | null,
  messageId: string, trackingToken: string, subject: string | null,
) {
  const { data, error } = await supabase.rpc('complete_sequence_email_delivery', {
    p_enrollment_id: enr.id, p_user_id: enr.user_id, p_step_id: step.id,
    p_current_step: enr.current_step ?? 0, p_message_id: messageId,
    p_tracking_token: trackingToken, p_next_action_at: nextAction, p_subject: subject,
  });
  if (error || data !== enr.id) throw error || new Error('Inscrição alterada durante o envio');
}
