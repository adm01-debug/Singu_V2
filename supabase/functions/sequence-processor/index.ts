// Sequence Processor — cron a cada 5min
// Avança enrollments, avalia branching condicional, envia emails e respeita pause-on-reply
import { createClient } from 'npm:@supabase/supabase-js@2';
import { scopedCorsHeaders, requireCronSecret } from "../_shared/auth.ts";

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
  current_step: number;
  next_action_at: string | null;
  enrolled_at: string;
  replied_at: string | null;
  last_step_sent_at: string | null;
}

interface SendLogEntry {
  enrollment_id: string;
  step_order: number;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const cronCheck = await requireCronSecret(req);
  if (cronCheck) return cronCheck;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();
  const stats = { processed: 0, sent: 0, advanced: 0, paused: 0, completed: 0, errors: 0 };

  try {
    // 1. Buscar enrollments ativos com next_action_at vencido
    const { data: enrollments, error: enrErr } = await supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('status', 'active')
      .lte('next_action_at', now.toISOString())
      .limit(100);

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
      { data: sequenceRows },
      { data: allStepsRows },
      { data: replyEventRows },
      { data: sendLogRows },
      { data: contactRows },
    ] = await Promise.all([
      supabase.from('sequences').select('id, pause_on_reply, pause_on_meeting').in('id', sequenceIds),
      supabase.from('sequence_steps').select('*').in('sequence_id', sequenceIds).order('step_order'),
      supabase.from('sequence_events').select('enrollment_id').in('enrollment_id', enrollmentIds).eq('event_type', 'replied'),
      supabase.from('sequence_send_log').select('enrollment_id, step_order, sent_at, opened_at, clicked_at').in('enrollment_id', enrollmentIds),
      supabase.from('contacts').select('id, first_name, last_name, email').in('id', contactIds),
    ]);

    // Build in-memory lookup structures
    const sequenceMap = new Map(
      (sequenceRows ?? []).map((s: { id: string; pause_on_reply: boolean; pause_on_meeting: boolean }) => [s.id, s])
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
      const inner = sendLogByEnrollment.get(log.enrollment_id) ?? new Map<number, SendLogEntry>();
      inner.set(log.step_order, log);
      sendLogByEnrollment.set(log.enrollment_id, inner);
    }

    const contactMap = new Map(
      (contactRows ?? []).map((c: Contact) => [c.id, c])
    );

    // Bulk-write accumulators — populate in pure computation loop, flush in parallel after
    type EnrRow = Record<string, unknown>;
    const repliedRows: EnrRow[] = [];
    const completedRows: EnrRow[] = [];
    const waitRows: EnrRow[] = [];
    const advanceRows: EnrRow[] = [];
    const nonEmailEventRows: EnrRow[] = [];
    type EmailJob = { enr: Enrollment; step: Step; contact: Contact | null; nextAction: string | null };
    const emailJobs: EmailJob[] = [];

    for (const enr of enrList) {
      stats.processed++;
      try {
        const seq = sequenceMap.get(enr.sequence_id);

        // 2. Pause-on-reply: se contato respondeu, pausa (Map lookup, no DB call)
        if (seq?.pause_on_reply) {
          if (enrollmentsWithReply.has(enr.id) || enr.replied_at) {
            repliedRows.push({ id: enr.id, status: 'replied', replied_at: enr.replied_at ?? now.toISOString() });
            stats.paused++;
            continue;
          }
        }

        // 3. Steps from Map — no DB call
        const steps = stepsBySeqId.get(enr.sequence_id) ?? [];

        if (steps.length === 0) {
          completedRows.push({ id: enr.id, status: 'completed', completed_at: now.toISOString() });
          stats.completed++;
          continue;
        }

        const nextStepOrder = enr.current_step + 1;
        let targetStep = steps.find((s) => s.step_order === nextStepOrder);

        // 4. Avaliar branching do step ANTERIOR — in-memory, no DB call
        if (enr.current_step > 0) {
          const prevStep = steps.find((s) => s.step_order === enr.current_step);
          if (prevStep && prevStep.condition_type !== 'always') {
            const sendLog = sendLogByEnrollment.get(enr.id)?.get(prevStep.step_order);
            const conditionMet = evaluateConditionInMemory(enr.id, prevStep, sendLog, enrollmentsWithReply);
            if (conditionMet === null) {
              const waitUntil = new Date(
                new Date(enr.last_step_sent_at ?? enr.enrolled_at).getTime() +
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
          stats.completed++;
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
          emailJobs.push({ enr, step: targetStep, contact: contactMap.get(enr.contact_id) ?? null, nextAction });
        } else {
          nonEmailEventRows.push({
            enrollment_id: enr.id,
            sequence_id: enr.sequence_id,
            contact_id: enr.contact_id,
            user_id: enr.user_id,
            step_order: targetStep.step_order,
            event_type: 'sent',
            metadata: { channel: targetStep.channel, manual_task: true },
          });
        }

        advanceRows.push({
          id: enr.id,
          current_step: targetStep.step_order,
          next_action_at: nextAction,
          last_step_sent_at: now.toISOString(),
          last_event_at: now.toISOString(),
          status: nextAction ? 'active' : 'completed',
          completed_at: nextAction ? null : now.toISOString(),
        });
        stats.advanced++;
      } catch (e) {
        console.error(`Erro enrollment ${enr.id}:`, e);
        stats.errors++;
      }
    }

    // Flush all accumulated writes in parallel (4 bulk upserts + parallel email sends)
    const emailResults = await Promise.allSettled(
      emailJobs.map((job) => sendEmailStep(supabase, job.enr, job.step, job.contact))
    );
    for (const result of emailResults) {
      if (result.status === 'fulfilled' && result.value) stats.sent++;
      else if (result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)) stats.errors++;
    }

    await Promise.all([
      repliedRows.length > 0
        ? supabase.from('sequence_enrollments').upsert(repliedRows, { onConflict: 'id' })
        : Promise.resolve(),
      completedRows.length > 0
        ? supabase.from('sequence_enrollments').upsert(completedRows, { onConflict: 'id' })
        : Promise.resolve(),
      waitRows.length > 0
        ? supabase.from('sequence_enrollments').upsert(waitRows, { onConflict: 'id' })
        : Promise.resolve(),
      advanceRows.length > 0
        ? supabase.from('sequence_enrollments').upsert(advanceRows, { onConflict: 'id' })
        : Promise.resolve(),
      nonEmailEventRows.length > 0
        ? supabase.from('sequence_events').insert(nonEmailEventRows)
        : Promise.resolve(),
    ]);

    return new Response(JSON.stringify({ ok: true, stats }), {
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
  supabase: ReturnType<typeof createClient>,
  enr: Enrollment,
  step: Step,
  contact: Contact | null,
): Promise<boolean> {
  try {
    if (!contact?.email) {
      await supabase.from('sequence_send_log').insert({
        enrollment_id: enr.id,
        step_id: step.id,
        sequence_id: enr.sequence_id,
        contact_id: enr.contact_id,
        user_id: enr.user_id,
        step_order: step.step_order,
        channel: 'email',
        status: 'failed',
        error_message: 'Contato sem email',
      });
      return false;
    }

    const body = (step.message_template ?? '')
      .replaceAll('{{first_name}}', contact.first_name ?? '')
      .replaceAll('{{last_name}}', contact.last_name ?? '');
    const subject = (step.subject ?? 'Mensagem')
      .replaceAll('{{first_name}}', contact.first_name ?? '');

    const { data: log } = await supabase
      .from('sequence_send_log')
      .insert({
        enrollment_id: enr.id,
        step_id: step.id,
        sequence_id: enr.sequence_id,
        contact_id: enr.contact_id,
        user_id: enr.user_id,
        step_order: step.step_order,
        channel: 'email',
        status: 'sent',
      })
      .select('id, tracking_token')
      .single();

    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'sequence-step',
          recipientEmail: contact.email,
          idempotencyKey: `seq-${enr.id}-step-${step.step_order}`,
          templateData: { subject, body, trackingToken: log?.tracking_token },
        },
      });
    } catch (e) {
      console.warn('send-transactional-email indisponível, log apenas:', e);
    }

    await supabase.from('sequence_events').insert({
      enrollment_id: enr.id,
      sequence_id: enr.sequence_id,
      contact_id: enr.contact_id,
      user_id: enr.user_id,
      step_order: step.step_order,
      event_type: 'sent',
      metadata: { channel: 'email', subject, tracking_token: log?.tracking_token },
    });

    await supabase.rpc('increment', { table_name: 'sequences' }).catch(() => {});

    return true;
  } catch (e) {
    console.error('sendEmailStep erro:', e);
    return false;
  }
}
