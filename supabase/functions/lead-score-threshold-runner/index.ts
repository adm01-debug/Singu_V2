// Lead Score Threshold Runner — dispara automações configuradas quando o score/grade muda.
// Modo: { contact_id, from_grade, to_grade, from_score, to_score }
// Aciona ações: notify | create_task | enroll_sequence | webhook | tag (respeitando cooldown).
import { createClient } from "npm:@supabase/supabase-js@2";
import { handleCorsAndMethod, withAuthOrServiceRole, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 120 });

interface Automation {
  id: string;
  user_id: string;
  name: string;
  trigger_type: 'grade_reached' | 'grade_dropped' | 'score_above' | 'score_below';
  grade_target: string | null;
  score_target: number | null;
  action_type: 'notify' | 'create_task' | 'enroll_sequence' | 'webhook' | 'tag';
  action_config: Record<string, unknown>;
  cooldown_hours: number;
  active: boolean;
  last_fired_at: string | null;
}

interface Payload {
  user_id: string;
  contact_id: string;
  from_grade: string | null;
  to_grade: string | null;
  from_score: number;
  to_score: number;
}

const GRADE_RANK: Record<string, number> = { D: 0, C: 1, B: 2, A: 3 };

function shouldFire(a: Automation, p: Payload): boolean {
  switch (a.trigger_type) {
    case 'grade_reached':
      if (!a.grade_target || !p.to_grade) return false;
      return p.to_grade === a.grade_target && p.from_grade !== a.grade_target;
    case 'grade_dropped':
      if (!a.grade_target || !p.to_grade) return false;
      return (
        (GRADE_RANK[p.to_grade] ?? -1) < (GRADE_RANK[a.grade_target] ?? -1) &&
        (GRADE_RANK[p.from_grade ?? ''] ?? -1) >= (GRADE_RANK[a.grade_target] ?? -1)
      );
    case 'score_above':
      if (a.score_target == null) return false;
      return p.to_score >= a.score_target && p.from_score < a.score_target;
    case 'score_below':
      if (a.score_target == null) return false;
      return p.to_score <= a.score_target && p.from_score > a.score_target;
  }
  return false;
}

async function executeAction(
  supabase: ReturnType<typeof createClient>,
  a: Automation,
  p: Payload,
): Promise<{ success: boolean; result: Record<string, unknown> }> {
  try {
    switch (a.action_type) {
      case 'notify': {
        const title = (a.action_config.title as string) || `Lead score: ${a.name}`;
        const description = (a.action_config.description as string)
          || `Contato passou de ${p.from_grade ?? '-'} (${p.from_score}) para ${p.to_grade ?? '-'} (${p.to_score})`;
        const { error } = await supabase.from('alerts').insert({
          user_id: a.user_id,
          contact_id: p.contact_id,
          type: 'lead_score_threshold',
          title,
          description,
          priority: (a.action_config.priority as string) ?? 'medium',
        });
        if (error) throw error;
        return { success: true, result: { kind: 'notify' } };
      }
      case 'create_task': {
        const title = (a.action_config.title as string) || `Follow-up: ${a.name}`;
        const description = (a.action_config.description as string)
          || `Lead atingiu ${p.to_grade ?? p.to_score}. Ação recomendada.`;
        const dueHours = Number(a.action_config.due_in_hours ?? 24);
        const expiresAt = new Date(Date.now() + dueHours * 3600_000).toISOString();
        const { error } = await supabase.from('alerts').insert({
          user_id: a.user_id,
          contact_id: p.contact_id,
          type: 'task',
          title,
          description,
          priority: (a.action_config.priority as string) ?? 'high',
          expires_at: expiresAt,
        });
        if (error) throw error;
        return { success: true, result: { kind: 'create_task', expires_at: expiresAt } };
      }
      case 'enroll_sequence': {
        const sequenceId = a.action_config.sequence_id as string;
        if (!sequenceId) throw new Error('sequence_id missing');
        // Evitar duplicar enrollment ativo
        const { data: existing } = await supabase
          .from('sequence_enrollments')
          .select('id, status')
          .eq('user_id', a.user_id)
          .eq('contact_id', p.contact_id)
          .eq('sequence_id', sequenceId)
          .in('status', ['active', 'paused'])
          .maybeSingle();
        if (existing?.id) return { success: true, result: { kind: 'enroll_sequence', skipped: 'already_enrolled' } };
        const { error } = await supabase.from('sequence_enrollments').insert({
          user_id: a.user_id,
          contact_id: p.contact_id,
          sequence_id: sequenceId,
          status: 'active',
          current_step: 0,
        });
        if (error) throw error;
        return { success: true, result: { kind: 'enroll_sequence', sequence_id: sequenceId } };
      }
      case 'webhook': {
        const url = a.action_config.url as string;
        if (!url || !/^https?:\/\//.test(url)) throw new Error('webhook url invalid');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const secret = a.action_config.secret as string | undefined;
        if (secret) headers['X-Webhook-Secret'] = secret;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            automation: a.name,
            contact_id: p.contact_id,
            from_grade: p.from_grade,
            to_grade: p.to_grade,
            from_score: p.from_score,
            to_score: p.to_score,
            fired_at: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000),
        });
        return { success: res.ok, result: { kind: 'webhook', status: res.status } };
      }
      case 'tag': {
        const tag = (a.action_config.tag as string)?.trim();
        if (!tag) throw new Error('tag missing');
        const { data: c } = await supabase.from('contacts').select('tags').eq('id', p.contact_id).maybeSingle();
        const current = (c?.tags as string[] | null) ?? [];
        if (current.includes(tag)) return { success: true, result: { kind: 'tag', skipped: 'already_tagged' } };
        const { error } = await supabase.from('contacts').update({ tags: [...current, tag] }).eq('id', p.contact_id);
        if (error) throw error;
        return { success: true, result: { kind: 'tag', tag } };
      }
    }
  } catch (e) {
    return { success: false, result: { error: (e as Error).message } };
  }
  return { success: false, result: { error: 'unknown_action' } };
}

Deno.serve(async (req: Request) => {
  const cors = handleCorsAndMethod(req);
  if (cors) return cors;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const auth = await withAuthOrServiceRole(req);
  if (auth instanceof Response) return auth;

  let body: Payload;
  try { body = await req.json() as Payload; } catch { return jsonError('Invalid JSON', 400, req); }

  if (!body?.user_id || !body?.contact_id) return jsonError('user_id and contact_id required', 400, req);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: automations } = await supabase
    .from('lead_score_threshold_automations')
    .select('*')
    .eq('user_id', body.user_id)
    .eq('active', true);

  const list = (automations ?? []) as Automation[];
  const fired: unknown[] = [];
  const now = Date.now();
  const nowIso = new Date().toISOString();

  // Filter which automations should fire (pure in-memory)
  const toFire = list.filter(a => {
    if (!shouldFire(a, body)) return false;
    if (a.last_fired_at) {
      const since = (now - new Date(a.last_fired_at).getTime()) / 3600_000;
      if (since < a.cooldown_hours) return false;
    }
    return true;
  });

  // Execute all actions (inherently sequential due to side-effects per automation)
  const results: Array<{ a: Automation; success: boolean; result: Record<string, unknown> }> = [];
  for (const a of toFire) {
    const { success, result } = await executeAction(supabase, a, body);
    results.push({ a, success, result });
    fired.push({ automation_id: a.id, name: a.name, success });
  }

  // Batch-insert all logs in one query + parallel update fired automations
  if (results.length > 0) {
    const logRows = results.map(({ a, success, result }) => ({
      user_id: a.user_id,
      automation_id: a.id,
      contact_id: body.contact_id,
      from_grade: body.from_grade,
      to_grade: body.to_grade,
      from_score: body.from_score,
      to_score: body.to_score,
      action_result: result,
      success,
    }));

    const successfulAutomations = results.filter(r => r.success);

    await Promise.all([
      supabase.from('lead_score_threshold_log').insert(logRows),
      ...successfulAutomations.map(({ a }) =>
        supabase.from('lead_score_threshold_automations').update({
          last_fired_at: nowIso,
          fired_count: ((a as unknown as { fired_count?: number }).fired_count ?? 0) + 1,
        }).eq('id', a.id)
      ),
    ]);
  }

  return jsonOk({ ok: true, fired_count: fired.length, fired }, req);
});
