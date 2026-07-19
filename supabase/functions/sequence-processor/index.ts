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

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const cronCheck = requireCronSecret(req);
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

    for (const enr of enrollments as Enrollment[]) {
      stats.processed++;
      try {
        // 2. Pause-on-reply: se contato respondeu, pausa
        const { data: seq } = await supabase
          .from('sequences')
          .select('pause_on_reply, pause_on_meeting')
          .eq('id', enr.sequence_id)
          .single();

        if (seq?.pause_on_reply) {
          const { data: replyEvent } = await supabase
            .from('sequence_events')
            .select('id')
            .eq('enrollment_id', enr.id)
            .eq('event_type', 'replied')
            .limit(1)
            .maybeSingle();

          if (replyEvent || enr.replied_at) {
            await supabase
              .from('sequence_enrollments')
              .update({ status: 'replied', replied_at: enr.replied_at ?? now.toISOString() })
              .eq('id', enr.id);
            stats.paused++;
            continue;
          }
        }

        // 3. Buscar próximo step
        const nextStepOrder = enr.current_step + 1;
        const { data: steps } = await supabase
          .from('sequence_steps')
          .select('*')
          .eq('sequence_id', enr.sequence_id)
          .order('step_order');

        if (!steps || steps.length === 0) {
          await supabase
            .from('sequence_enrollments')
            .update({ status: 'completed', completed_at: now.toISOString() })
            .eq('id', enr.id);
          stats.completed++;
          continue;
        }

        let targetStep = (steps as Step[]).find((s) => s.step_order === nextStepOrder);

        // 4. Avaliar branching do step ANTERIOR (se houver)
        if (enr.current_step > 0) {
          const prevStep = (steps as Step[]).find((s) => s.step_order === enr.current_step);
          if (prevStep && prevStep.condition_type !== 'always') {
            const conditionMet = await evaluateCondition(supabase, enr.id, prevStep);
            if (conditionMet === null) {
              // ainda esperando janela de avaliação
              const waitUntil = new Date(
                new Date(enr.last_step_sent_at ?? enr.enrolled_at).getTime() +
                  prevStep.condition_wait_hours * 3600_000,
              );
              await supabase
                .from('sequence_enrollments')
                .update({ next_action_at: waitUntil.toISOString() })
                .eq('id', enr.id);
              continue;
            }
            const branchTo = conditionMet ? prevStep.branch_on_yes_step : prevStep.branch_on_no_step;
            if (branchTo !== null && branchTo !== undefined) {
              targetStep = (steps as Step[]).find((s) => s.step_order === branchTo);
            }
          }
        }

        if (!targetStep) {
          await supabase
            .from('sequence_enrollments')
            .update({ status: 'completed', completed_at: now.toISOString() })
            .eq('id', enr.id);
          stats.completed++;
          continue;
        }

        // 5. Enviar email se canal = email
        if (targetStep.channel === 'email') {
          const sent = await sendEmailStep(supabase, enr, targetStep);
          if (sent) stats.sent++;
          else stats.errors++;
        } else {
          // outros canais: registra evento "sent" sem envio real (placeholder p/ tarefa manual)
          await supabase.from('sequence_events').insert({
            enrollment_id: enr.id,
            sequence_id: enr.sequence_id,
            contact_id: enr.contact_id,
            user_id: enr.user_id,
            step_order: targetStep.step_order,
            event_type: 'sent',
            metadata: { channel: targetStep.channel, manual_task: true },
          });
        }

        // 6. Calcular próximo next_action_at baseado no delay do PRÓXIMO step
        const upcomingStep = (steps as Step[]).find((s) => s.step_order === targetStep.step_order + 1);
        let nextAction: string | null = null;
        if (upcomingStep) {
          const delayMs =
            (upcomingStep.delay_days * 86400 + upcomingStep.delay_hours * 3600) * 1000;
          nextAction = new Date(now.getTime() + delayMs).toISOString();
        }

        await supabase
          .from('sequence_enrollments')
          .update({
            current_step: targetStep.step_order,
            next_action_at: nextAction,
            last_step_sent_at: now.toISOString(),
            last_event_at: now.toISOString(),
            status: nextAction ? 'active' : 'completed',
            completed_at: nextAction ? null : now.toISOString(),
          })
          .eq('id', enr.id);

        stats.advanced++;
      } catch (e) {
        console.error(`Erro enrollment ${enr.id}:`, e);
        stats.errors++;
      }
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Sequence processor fatal:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e), stats }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

async function evaluateCondition(
  supabase: any,
  enrollmentId: string,
  step: Step,
): Promise<boolean | null> {
  // Janela: precisa ter passado condition_wait_hours desde o envio do step
  const { data: sendLog } = await supabase
    .from('sequence_send_log')
    .select('sent_at, opened_at, clicked_at')
    .eq('enrollment_id', enrollmentId)
    .eq('step_order', step.step_order)
    .maybeSingle();

  if (!sendLog) return false;
  const sentTime = new Date(sendLog.sent_at).getTime();
  const elapsed = (Date.now() - sentTime) / 3600_000;
  if (elapsed < step.condition_wait_hours) return null; // ainda esperando

  const { data: replied } = await supabase
    .from('sequence_events')
    .select('id')
    .eq('enrollment_id', enrollmentId)
    .eq('event_type', 'replied')
    .limit(1)
    .maybeSingle();

  switch (step.condition_type) {
    case 'if_opened':
      return !!sendLog.opened_at;
    case 'if_not_opened':
      return !sendLog.opened_at;
    case 'if_clicked':
      return !!sendLog.clicked_at;
    case 'if_replied':
      return !!replied;
    case 'if_not_replied':
      return !replied;
    default:
      return true;
  }
}

async function sendEmailStep(supabase: any, enr: Enrollment, step: Step): Promise<boolean> {
  try {
    // Buscar email do contato
    const { data: contact } = await supabase
      .from('contacts')
      .select('first_name, last_name, email')
      .eq('id', enr.contact_id)
      .maybeSingle();

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

    // Render template (substituições simples)
    const body = (step.message_template ?? '')
      .replaceAll('{{first_name}}', contact.first_name ?? '')
      .replaceAll('{{last_name}}', contact.last_name ?? '');
    const subject = (step.subject ?? 'Mensagem')
      .replaceAll('{{first_name}}', contact.first_name ?? '');

    // Registrar log com tracking_token gerado pelo default
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

    // Tentar enviar via send-transactional-email se existir
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

    // Atualizar total_enrolled stats
    await supabase.rpc('increment', { table_name: 'sequences' }).catch(() => {});

    return true;
  } catch (e) {
    console.error('sendEmailStep erro:', e);
    return false;
  }
}
