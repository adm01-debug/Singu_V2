import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

type Scenario = 'ausente' | 'sem-id' | 'confirmado' | 'log-falha' | 'evento-falha' | 'avanco-vazio' | 'consulta-falha' | 'contato-alheio' | 'legado' | 'confirmado-existente' | 'manual' | 'sequencia-pausada' | 'resposta';
interface Operation { table: string; method: string; body: Record<string, unknown>; query: URLSearchParams }

const owner = '11111111-1111-4111-8111-111111111111';
const enrollment = '22222222-2222-4222-8222-222222222222';
const sequence = '33333333-3333-4333-8333-333333333333';
const contact = '44444444-4444-4444-8444-444444444444';
const step = '55555555-5555-4555-8555-555555555555';

async function withProcessor(scenario: Scenario, test: (call: (manual?: boolean, headers?: Record<string, string>) => Promise<Response>, operations: Operation[]) => Promise<void>) {
  const operations: Operation[] = [];
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
  const backend = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async req => {
    const url = new URL(req.url);
    const table = url.pathname.split('/').pop()!;
    const body = req.method === 'GET' ? {} : await req.json();
    operations.push({ table, method: req.method, body, query: url.searchParams });
    if (url.pathname === '/auth/v1/user') return json({ id: owner });
    if (url.pathname.startsWith('/functions/')) {
      if (scenario === 'ausente') return json({ error: 'Função não encontrada' }, 404);
      return json(scenario === 'sem-id' ? { ok: true } : { ok: true, messageId: 'provedor-123' });
    }
    if (req.method === 'GET') {
      if (table === 'sequence_enrollments') return json([{
        id: enrollment, sequence_id: sequence, contact_id: contact, user_id: owner,
        status: 'active', current_step: 0, next_action_at: '2020-01-01T00:00:00Z',
        enrolled_at: '2020-01-01T00:00:00Z', replied_at: null, last_step_executed_at: null,
      }]);
      if (table === 'sequences') return json([{ id: sequence, user_id: owner, status: scenario === 'sequencia-pausada' ? 'paused' : 'active', pause_on_reply: true }]);
      if (table === 'sequence_steps') {
        if (scenario === 'consulta-falha') return json({ code: '42703', message: 'Coluna ausente' }, 400);
        return json([{
          id: step, sequence_id: sequence, step_order: 1,
          channel: scenario === 'manual' ? 'phone' : 'email', delay_days: 0, delay_hours: 0,
          subject: 'Olá {{first_name}}', message_template: 'Mensagem {{first_name}}', condition_type: 'always',
        }]);
      }
      if (table === 'sequence_events') return json(scenario === 'resposta' ? [{ enrollment_id: enrollment }] : []);
      if (table === 'contacts') return json([{ id: contact, user_id: scenario === 'contato-alheio' ? sequence : owner, first_name: 'Pessoa', last_name: 'Teste', email: 'teste@example.invalid' }]);
      if (table === 'sequence_send_log') return json(['legado', 'confirmado-existente'].includes(scenario) ? [{
        enrollment_id: enrollment, step_order: 1, sent_at: '2020-01-01T00:00:00Z',
        opened_at: null, clicked_at: null, status: 'sent', message_id: scenario === 'legado' ? null : 'provedor-123',
      }] : []);
    }
    if (req.method === 'PATCH') return json(scenario === 'avanco-vazio' ? null : { id: enrollment });
    if ((scenario === 'log-falha' && table === 'sequence_send_log' && body.status === 'sent') || (scenario === 'evento-falha' && table === 'sequence_events')) return json({ code: 'XX000', message: 'Falha de gravação' }, 500);
    return json(null);
  });
  const process = new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '--node-modules-dir=none', '--allow-net=127.0.0.1,0.0.0.0:8000', '--allow-env', new URL('../sequence-processor/index.ts', import.meta.url).pathname],
    clearEnv: true,
    env: { HOME: Deno.env.get('HOME')!, SUPABASE_URL: `http://127.0.0.1:${backend.addr.port}`, SUPABASE_SERVICE_ROLE_KEY: 'service-teste', SUPABASE_ANON_KEY: 'anon-teste', CRON_SECRET: 'cron-teste' },
    stdout: 'null', stderr: 'inherit',
  }).spawn();
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const response = await fetch('http://127.0.0.1:8000', { method: 'OPTIONS', signal: AbortSignal.timeout(1_000) });
        await response.arrayBuffer();
        ready = true;
        break;
      } catch { await new Promise(resolve => setTimeout(resolve, 30)); }
    }
    assert(ready, 'O processador deve iniciar');
    await test((manual = false, headers) => fetch('http://127.0.0.1:8000', {
      method: 'POST', headers: headers ?? (manual ? { authorization: 'Bearer usuario-teste' } : { 'x-cron-secret': 'cron-teste' }),
      signal: AbortSignal.timeout(10_000),
    }), operations);
    assert(!operations.some(operation => operation.table === 'increment'), 'Nenhum RPC inexistente deve ser chamado');
  } finally {
    try { process.kill('SIGTERM'); } catch { /* O processo pode ter terminado durante a inicialização. */ }
    await process.status;
    await backend.shutdown();
  }
}

for (const scenario of ['ausente', 'sem-id', 'contato-alheio', 'legado'] as const) {
  Deno.test(`Sequências: ${scenario} não confirma envio nem avança`, () => withProcessor(scenario, async (call, operations) => {
    const response = await call();
    assertEquals(response.status, 200);
    const result = await response.json();
    assertEquals(result.ok, false);
    assertEquals(result.stats.sent, 0);
    assertEquals(result.stats.advanced, 0);
    assertEquals(result.stats.paused, 1);
    assert(!operations.some(operation => operation.body.status === 'sent' || operation.body.current_step === 1));
    if (['contato-alheio', 'legado'].includes(scenario)) assert(!operations.some(operation => operation.table === 'send-transactional-email'));
  }));
}

Deno.test('Sequências: confirmação precede log, evento e avanço canônico', () => withProcessor('confirmado', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  assertEquals(result.stats.sent, 1);
  assertEquals(result.stats.advanced, 1);
  assertEquals(result.stats.completed, 1);
  const writes = operations.filter(operation => operation.method !== 'GET');
  assertEquals(writes.map(operation => operation.table), ['send-transactional-email', 'sequence_send_log', 'sequence_events', 'sequence_enrollments']);
  assertEquals(writes[1].body.message_id, 'provedor-123');
  const update = writes[3];
  assertEquals(update.body.current_step, 1);
  assertEquals(update.query.get('current_step'), 'eq.0');
  assertEquals(update.query.get('status'), 'eq.active');
  assert(typeof update.body.last_step_executed_at === 'string');
  assert(!('last_step_sent_at' in update.body) && !('last_event_at' in update.body));
}));

for (const scenario of ['log-falha', 'evento-falha', 'avanco-vazio'] as const) {
  Deno.test(`Sequências: ${scenario} não confirma avanço`, () => withProcessor(scenario, async (call, operations) => {
    const result = await (await call()).json();
    assertEquals(result.ok, false);
    assertEquals(result.stats.sent, 1);
    assertEquals(result.stats.advanced, 0);
    assert(!operations.some(operation => operation.body.status === 'failed'), 'Aceite conhecido do provedor deve ser preservado');
    if (scenario !== 'avanco-vazio') assertEquals(result.stats.paused, 1);
    else assertEquals(result.stats.paused, 0);
    if (scenario !== 'avanco-vazio') assert(!operations.some(operation => operation.body.current_step === 1));
  }));
}

Deno.test('Sequências: consulta inválida retorna erro em vez de concluir inscrição', () => withProcessor('consulta-falha', async call => {
  const response = await call();
  assertEquals(response.status, 500);
  assertEquals((await response.json()).ok, false);
}));

Deno.test('Sequências: envio já confirmado não é repetido', () => withProcessor('confirmado-existente', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  assertEquals(result.stats.sent, 0);
  assertEquals(result.stats.advanced, 1);
  assert(!operations.some(operation => operation.table === 'send-transactional-email' || (operation.method === 'POST' && operation.table === 'sequence_send_log')));
}));

Deno.test('Sequências: canal manual sem execução confirmada fica pausado', () => withProcessor('manual', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, false);
  assertEquals(result.stats.paused, 1);
  assertEquals(result.stats.advanced, 0);
  assert(!operations.some(operation => operation.body.event_type === 'sent' || operation.body.current_step === 1));
}));

Deno.test('Sequências: sequência pausada não envia nem muda inscrições', () => withProcessor('sequencia-pausada', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  assertEquals(result.stats.sent, 0);
  assert(!operations.some(operation => operation.method !== 'GET'));
}));

Deno.test('Sequências: resposta pausa com UPDATE condicional, sem upsert incompleto', () => withProcessor('resposta', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  assertEquals(result.stats.paused, 1);
  assertEquals(operations.filter(operation => operation.table === 'sequence_enrollments' && operation.method !== 'GET').map(operation => operation.method), ['PATCH']);
}));

Deno.test('Sequências: chamada manual usa somente o usuário autenticado', () => withProcessor('ausente', async (call, operations) => {
  const response = await call(true);
  assertEquals(response.status, 200);
  await response.arrayBuffer();
  assertEquals(operations.find(operation => operation.table === 'sequence_enrollments')?.query.get('user_id'), `eq.${owner}`);
}));

Deno.test('Sequências: cron inválido e serviço sem cron são recusados', () => withProcessor('confirmado', async (call, operations) => {
  const attempts: Array<Record<string, string>> = [{ 'x-cron-secret': 'invalido' }, { authorization: 'Bearer service-teste' }];
  for (const headers of attempts) {
    const response = await call(false, headers);
    assertEquals(response.status, 401);
    await response.arrayBuffer();
  }
  assertEquals(operations.length, 0);
}));
