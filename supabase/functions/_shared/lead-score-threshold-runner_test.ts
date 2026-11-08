import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const owner = '11111111-1111-4111-8111-111111111111';
const contact = '22222222-2222-4222-8222-222222222222';
interface Operation { table: string; body: Record<string, unknown> | Array<Record<string, unknown>> }

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

async function withRunner(test: (call: (userId?: string) => Promise<Response>, operations: Operation[]) => Promise<void>) {
  const operations: Operation[] = [];
  const backend = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, async req => {
    const url = new URL(req.url);
    const table = url.pathname.split('/').pop()!;
    if (url.pathname === '/auth/v1/user') return json({ id: owner });
    if (req.method === 'GET') {
      if (table === 'contacts') return json({ id: contact });
      return json(['sucesso', 'falha'].map(id => ({
        id, user_id: owner, name: id, active: true, trigger_type: 'score_above',
        score_target: 60, cooldown_hours: 0, last_fired_at: null,
        action_type: 'enroll_sequence', action_config: { sequence_id: 'sequência-protegida' },
      })));
    }
    const body: Record<string, unknown> | Array<Record<string, unknown>> = await req.json();
    operations.push({ table, body });
    if (table === 'enroll_lead_score_contact') {
      assert(!Array.isArray(body));
      assertEquals(body.p_user_id, owner);
      assertEquals(body.p_contact_id, contact);
      return body.p_automation_id === 'falha'
        ? json({ code: '23514', message: 'Limite de inscrições atingido' }, 400)
        : json({ id: '33333333-3333-4333-8333-333333333333', created: true });
    }
    return json(null);
  });
  const process = new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '--node-modules-dir=none', '--allow-net=127.0.0.1,0.0.0.0:8000', '--allow-env',
      new URL('../lead-score-threshold-runner/index.ts', import.meta.url).pathname],
    clearEnv: true,
    env: { HOME: Deno.env.get('HOME')!, SUPABASE_URL: `http://127.0.0.1:${backend.addr.port}`,
      SUPABASE_SERVICE_ROLE_KEY: 'service-teste', SUPABASE_ANON_KEY: 'anon-teste' },
    stdout: 'null', stderr: 'inherit',
  }).spawn();
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        const response = await fetch('http://127.0.0.1:8000', { method: 'OPTIONS', signal: AbortSignal.timeout(1000) });
        await response.arrayBuffer();
        ready = true;
        break;
      } catch { await new Promise(resolve => setTimeout(resolve, 30)); }
    }
    assert(ready, 'O worker deve iniciar');
    await test((userId = owner) => fetch('http://127.0.0.1:8000', {
      method: 'POST', headers: { authorization: 'Bearer usuario-teste', 'content-type': 'application/json' },
      body: JSON.stringify({ user_id: userId, contact_id: contact, from_grade: 'D', to_grade: 'A', from_score: 40, to_score: 80 }),
      signal: AbortSignal.timeout(10_000),
    }), operations);
  } finally {
    try { process.kill('SIGTERM'); } catch { /* O processo já pode ter encerrado. */ }
    await process.status;
    await backend.shutdown();
  }
}

Deno.test('Lead score: falha individual não impede outra inscrição nem registra sucesso falso', () => withRunner(async (call, operations) => {
  const response = await call();
  assertEquals(response.status, 200);
  const result = await response.json();
  assertEquals(result.ok, false);
  assertEquals(result.fired_count, 1);
  assertEquals(result.fired.map((entry: { success: boolean }) => entry.success), [true, false]);
  assertEquals(operations.filter(op => op.table === 'enroll_lead_score_contact').length, 2);
  assert(!operations.some(op => op.table === 'sequence_enrollments'));
  const log = operations.find(op => op.table === 'lead_score_threshold_log');
  assert(log);
  assertEquals(log.body, [{
    user_id: owner, automation_id: 'falha', contact_id: contact,
    from_grade: 'D', to_grade: 'A', from_score: 40, to_score: 80,
    action_result: { error: 'Limite de inscrições atingido' }, success: false,
  }]);
  assert(!operations.some(op => op.table === 'alerts' || op.table === 'lead_score_threshold_automations'));
}));

Deno.test('Lead score: conta autenticada não executa ações em nome de outra conta', () => withRunner(async (call, operations) => {
  const response = await call('44444444-4444-4444-8444-444444444444');
  assertEquals(response.status, 403);
  assertEquals(operations.length, 0);
}));
