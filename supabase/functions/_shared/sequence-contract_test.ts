import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

type Scenario = 'ausente' | 'sem-id' | 'confirmado' | 'log-falha' | 'evento-falha' | 'avanco-vazio' | 'consulta-falha' | 'contato-alheio' | 'legado' | 'legado-retomado' | 'legado-sem-recibo' | 'confirmado-existente' | 'manual' | 'sequencia-pausada' | 'resposta' | 'bounce-espera' | 'bounce-apos' | 'progresso-nulo' | 'progresso-nulo-falha' | 'logs-paginados' | 'arquivado-apos-preload' | 'arquivado-antes-reserva' | 'reserva-ocupada' | 'reserva-resposta-perdida' | 'reserva-rejeitada-sem-reserva' | 'reserva-rejeitada-com-reserva' | 'provedor-incerto';
interface Operation { table: string; method: string; body: Record<string, unknown>; query: URLSearchParams }

const owner = '11111111-1111-4111-8111-111111111111';
const enrollment = '22222222-2222-4222-8222-222222222222';
const sequence = '33333333-3333-4333-8333-333333333333';
const contact = '44444444-4444-4444-8444-444444444444';
const step = '55555555-5555-4555-8555-555555555555';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}

const pendingReservations: Partial<Record<Scenario, unknown[]>> = { 'reserva-rejeitada-com-reserva': [{ token: 'reserva-anterior' }] };

function mockRead(table: string, scenario: Scenario, query: URLSearchParams): Response {
  if (table === 'sequence_email_reservations') return json(pendingReservations[scenario] ?? []);
  const currentStep = scenario.startsWith('progresso-nulo') ? null : 0;
  if (table === 'sequence_enrollments') return json([{
    id: enrollment, sequence_id: sequence, contact_id: contact, user_id: owner,
    status: 'active', current_step: scenario.startsWith('bounce-') ? 1 : currentStep, next_action_at: '2020-01-01T00:00:00Z',
    enrolled_at: '2020-01-01T00:00:00Z', replied_at: null, last_step_executed_at: null,
    metadata: scenario.startsWith('legado-') ? { retry_unconfirmed_email: {
      step_order: 1, receipt_id: '88888888-8888-4888-8888-888888888888',
    } } : {},
  }]);
  if (table === 'sequences') return json([{ id: sequence, user_id: owner, status: scenario === 'sequencia-pausada' ? 'paused' : 'active', pause_on_reply: true }]);
  if (table === 'sequence_steps') {
    if (scenario === 'consulta-falha') return json({ code: '42703', message: 'Coluna ausente' }, 400);
    const steps = [{
      id: step, sequence_id: sequence, step_order: 1,
      channel: scenario === 'manual' ? 'phone' : 'email', delay_days: 0, delay_hours: 0,
      subject: 'Olá {{first_name}}', message_template: 'Mensagem {{first_name}}',
      condition_type: scenario.startsWith('bounce-') ? 'if_not_opened' : 'always',
      condition_wait_hours: 24, branch_on_yes_step: 3, branch_on_no_step: 2,
    }];
    if (scenario.startsWith('bounce-')) steps.push(
      { ...steps[0], id: '66666666-6666-4666-8666-666666666666', step_order: 2, channel: 'phone' },
      { ...steps[0], id: '77777777-7777-4777-8777-777777777777', step_order: 3, channel: 'email' },
    );
    return json(steps);
  }
  if (table === 'sequence_events') {
    if (query.get('event_type') === 'eq.email_resumed') {
      assertEquals(query.get('user_id'), `eq.${owner}`);
      assertEquals(query.get('enrollment_id'), `eq.${enrollment}`);
      assertEquals(query.get('sequence_id'), `eq.${sequence}`);
      assertEquals(query.get('contact_id'), `eq.${contact}`);
      assertEquals(query.get('step_order'), 'eq.1');
      return json(scenario === 'legado-retomado' ? { id: '88888888-8888-4888-8888-888888888888' } : null);
    }
    return json(scenario === 'resposta' ? [{ enrollment_id: enrollment }] : []);
  }
  if (table === 'contacts') {
    if (scenario === 'arquivado-apos-preload' && query.get('id') === `eq.${contact}`) return json([]);
    return json([{ id: contact, user_id: scenario === 'contato-alheio' ? sequence : owner, first_name: 'Pessoa', last_name: 'Teste', email: 'teste@example.invalid' }]);
  }
  if (table === 'sequence_send_log' && scenario === 'logs-paginados') return json(query.get('offset') === '1000' ? [{
    enrollment_id: enrollment, step_order: 1, sent_at: '2020-01-01T00:00:00Z', opened_at: null, clicked_at: null, status: 'sent', message_id: 'provedor-123',
  }] : Array.from({ length: 1000 }, (_, index) => ({
    enrollment_id: enrollment, step_order: 100 + index, sent_at: '2019-01-01T00:00:00Z', opened_at: null, clicked_at: null, status: 'sent', message_id: `antigo-${index}`,
  })));
  if (table === 'sequence_send_log') return json(scenario.startsWith('legado') || ['confirmado-existente', 'bounce-espera', 'bounce-apos'].includes(scenario) ? [{
    enrollment_id: enrollment, step_order: 1, sent_at: scenario === 'bounce-espera' ? new Date().toISOString() : '2020-01-01T00:00:00Z',
    opened_at: null, clicked_at: null, status: scenario.startsWith('bounce-') ? 'bounced' : 'sent', message_id: scenario.startsWith('legado') ? null : 'provedor-123',
  }] : []);
  return json([]);
}

async function withProcessor(scenario: Scenario, test: (call: (manual?: boolean, headers?: Record<string, string>) => Promise<Response>, operations: Operation[]) => Promise<void>) {
  const operations: Operation[] = [];
  let heldToken: string | null = null;
  const backend = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async req => {
    const url = new URL(req.url);
    const table = url.pathname.split('/').pop()!;
    const body = req.method === 'GET' ? {} : await req.json();
    operations.push({ table, method: req.method, body, query: url.searchParams });
    if (url.pathname === '/auth/v1/user') return json({ id: owner });
    if (url.pathname.startsWith('/functions/')) {
      if (scenario === 'ausente' || scenario === 'progresso-nulo-falha') return json({ code: 'NOT_FOUND', message: 'Função não encontrada' }, 404);
      if (scenario === 'provedor-incerto') return json({ error: 'Resposta perdida após a solicitação ao provedor' }, 500);
      return json(scenario === 'sem-id' ? { ok: true } : { ok: true, messageId: 'provedor-123' });
    }
    if (table === 'reserve_sequence_email_send') {
      if (scenario === 'arquivado-antes-reserva' || scenario.startsWith('reserva-rejeitada-')) return json({ code: '42501', message: 'Contato indisponível para envio' }, 403);
      if (heldToken || scenario === 'reserva-ocupada') return json(null);
      assertEquals(typeof body.p_token, 'string');
      heldToken = String(body.p_token);
      if (scenario === 'reserva-resposta-perdida') return json({ code: '503', message: 'Resposta perdida após a reserva' }, 503);
      return json({
        id: contact, user_id: owner, first_name: 'Pessoa', last_name: 'Silva',
        email: 'maria@example.test', token: heldToken,
      });
    }
    if (table === 'release_sequence_email_send') {
      assertEquals(body.p_token, heldToken);
      heldToken = null;
      return json(true);
    }
    if (table === 'complete_sequence_email_delivery') return atomicResponse(scenario);
    if (req.method === 'GET') return mockRead(table, scenario, url.searchParams);
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

for (const scenario of ['legado-retomado', 'legado-sem-recibo'] as const) {
  Deno.test(`Sequências: ${scenario} valida o recibo antes de consumir a retomada`, () => withProcessor(scenario, async (call, operations) => {
    const result = await (await call()).json();
    const resumed = scenario === 'legado-retomado';
    assertEquals(result.stats.sent, resumed ? 1 : 0);
    assertEquals(result.stats.advanced, resumed ? 1 : 0);
    assertEquals(result.stats.paused, resumed ? 0 : 1);
    const delivery = operations.find(operation => operation.table === 'send-transactional-email');
    assertEquals(!!delivery, resumed);
    if (delivery) assertEquals(delivery.body.idempotencyKey, `seq-${enrollment}-step-1`);
    assertEquals(operations.some(operation => operation.table === 'complete_sequence_email_delivery'), resumed);
  }));
}

function atomicResponse(scenario: Scenario): Response {
  const failed = scenario === 'log-falha' || scenario === 'evento-falha';
  return new Response(JSON.stringify(failed ? { code: 'XX000', message: 'Transação rejeitada' } : scenario === 'avanco-vazio' ? null : enrollment), {
    status: failed ? 500 : 200, headers: { 'content-type': 'application/json' },
  });
}

for (const scenario of ['sem-id', 'provedor-incerto', 'log-falha', 'evento-falha', 'avanco-vazio'] as const) {
  Deno.test(`Sequências: ${scenario} mantém a reserva e impede uma segunda chamada ao provedor`, () => withProcessor(scenario, async (call, operations) => {
    const first = await (await call()).json();
    assertEquals(first.stats.advanced, 0);
    const retry = await (await call()).json();
    assertEquals(retry.stats.sent, 0);
    assertEquals(retry.stats.advanced, 0);
    assertEquals(operations.filter(operation => operation.table === 'send-transactional-email').length, 1);
    assert(!operations.some(operation => operation.table === 'release_sequence_email_send'));
  }));
}

Deno.test('Sequências: reserva ocupada não envia nem pausa o trabalho de outro processador', () => withProcessor('reserva-ocupada', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  assertEquals(result.stats.sent, 0);
  assertEquals(result.stats.paused, 0);
  assert(!operations.some(operation => operation.table === 'send-transactional-email' || operation.method === 'PATCH'));
}));

Deno.test('Sequências: resposta perdida após a reserva não oferece retomada nem repete envio', () => withProcessor('reserva-resposta-perdida', async (call, operations) => {
  const first = await (await call()).json();
  assertEquals(first.stats.errors, 1);
  assertEquals(first.stats.paused, 0);
  const retry = await (await call()).json();
  assertEquals(retry.stats.sent, 0);
  assertEquals(retry.stats.paused, 0);
  assertEquals(operations.filter(operation => operation.table === 'reserve_sequence_email_send').length, 2);
  assert(!operations.some(operation => operation.table === 'send-transactional-email' || operation.table === 'release_sequence_email_send' || operation.method === 'PATCH'));
}));

Deno.test('Sequências: rejeição confirmada sem reserva pausa e registra falha', () => withProcessor('reserva-rejeitada-sem-reserva', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.paused, 1);
  assert(operations.some(operation => operation.table === 'sequence_send_log' && operation.body.status === 'failed'));
  assert(!operations.some(operation => operation.table === 'send-transactional-email' || operation.table === 'release_sequence_email_send'));
}));

Deno.test('Sequências: rejeição confirmada com reserva concorrente não pausa', () => withProcessor('reserva-rejeitada-com-reserva', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.paused, 0);
  assert(!operations.some(operation => operation.method === 'PATCH' || operation.table === 'send-transactional-email' || operation.table === 'release_sequence_email_send'));
}));

Deno.test('Sequências: arquivamento entre consulta e reserva impede a chamada externa', () => withProcessor('arquivado-antes-reserva', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.sent, 0);
  assertEquals(result.stats.advanced, 0);
  assert(!operations.some(operation => operation.table === 'send-transactional-email'));
}));

Deno.test('Sequências: função comprovadamente ausente libera a reserva sem registrar envio', () => withProcessor('ausente', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.sent, 0);
  assertEquals(result.stats.advanced, 0);
  assertEquals(operations.filter(operation => operation.table === 'release_sequence_email_send').length, 1);
  assert(!operations.some(operation => operation.table === 'complete_sequence_email_delivery'));
}));

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
  assertEquals(writes.map(operation => operation.table), [
    'reserve_sequence_email_send', 'send-transactional-email',
    'complete_sequence_email_delivery', 'release_sequence_email_send',
  ]);
  assertEquals(writes[2].body.p_message_id, 'provedor-123');
  assertEquals(writes[2].body.p_current_step, 0);
  assertEquals(writes[2].body.p_user_id, owner);
  assertEquals(writes[2].body.p_step_id, step);
  assertEquals(writes[2].body.p_next_action_at, null);
  assertEquals(writes[2].body.p_subject, 'Olá Pessoa');
  assertEquals(writes[1].body.idempotencyKey, `seq-${enrollment}-step-1`);
  assertEquals(writes[3].body.p_token, writes[0].body.p_token);
}));

Deno.test('Sequências: progresso nulo usa a primeira etapa após normalização', () => withProcessor('progresso-nulo', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.sent, 1);
  assertEquals(result.stats.advanced, 1);
  assertEquals(operations.find(operation => operation.table === 'complete_sequence_email_delivery')?.body.p_current_step, 0);
}));

Deno.test('Sequências: confirmação após 1.000 logs evita novo envio', () => withProcessor('logs-paginados', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.sent, 0);
  assertEquals(result.stats.advanced, 1);
  assert(!operations.some(operation => operation.table === 'send-transactional-email'));
  assertEquals(operations.filter(operation => operation.table === 'sequence_send_log' && operation.method === 'GET').map(operation => operation.query.get('offset')), ['0', '1000']);
}));

Deno.test('Sequências: falha com progresso nulo pausa sem repetir o envio', () => withProcessor('progresso-nulo-falha', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.sent, 0);
  assertEquals(result.stats.paused, 1);
  assertEquals(operations.find(operation => operation.table === 'sequence_enrollments' && operation.method === 'PATCH')?.query.get('current_step'), 'is.null');
  assert(!operations.some(operation => operation.table === 'complete_sequence_email_delivery'));
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
  assertEquals(operations.find(operation => operation.table === 'complete_sequence_email_delivery')?.body.p_message_id, 'provedor-123');
}));

Deno.test('Sequências: sequência pausada não consome o limite do lote', () => withProcessor('sequencia-pausada', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  const query = operations.find(operation => operation.table === 'sequence_enrollments')?.query;
  assertEquals(query?.get('sequences.status'), 'eq.active');
  assertEquals(query?.get('select'), '*,sequences!inner(status)');
  assertEquals(query?.get('limit'), '100');
}));

Deno.test('Sequências: devolução confirmada aguarda prazo sem tentar enviar', () => withProcessor('bounce-espera', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  assertEquals(result.stats.sent, 0);
  const wait = operations.find(operation => operation.table === 'sequence_enrollments' && operation.method === 'PATCH');
  assert(wait && new Date(wait.body.next_action_at as string).getTime() > Date.now() + 23 * 3600_000);
  assert(!operations.some(operation => operation.table === 'send-transactional-email'));
}));

Deno.test('Sequências: devolução confirmada segue o ramo não aberto após prazo', () => withProcessor('bounce-apos', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, true);
  const delivered = operations.find(operation => operation.table === 'complete_sequence_email_delivery');
  assertEquals(delivered?.body.p_step_id, '77777777-7777-4777-8777-777777777777');
  assertEquals(delivered?.body.p_current_step, 1);
}));

Deno.test('Sequências: canal manual sem execução confirmada fica pausado', () => withProcessor('manual', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.ok, false);
  assertEquals(result.stats.paused, 1);
  assertEquals(result.stats.advanced, 0);
  assert(!operations.some(operation => operation.body.event_type === 'sent' || operation.body.current_step === 1));
  const pause = operations.find(operation => operation.table === 'sequence_enrollments' && operation.method === 'PATCH');
  assertEquals(pause?.body.metadata, {
    pending_manual_step: { step_id: step, step_order: 1, channel: 'phone' },
  });
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

Deno.test('Sequências: arquivamento após preload bloqueia o disparo e pausa a inscrição', () => withProcessor('arquivado-apos-preload', async (call, operations) => {
  const result = await (await call()).json();
  assertEquals(result.stats.sent, 0);
  assertEquals(result.stats.advanced, 0);
  assertEquals(result.stats.paused, 1);
  assert(!operations.some(operation => operation.table === 'send-transactional-email'));
  const revalidation = operations.find(operation => operation.table === 'contacts' && operation.query.get('id') === `eq.${contact}`);
  assertEquals(revalidation?.query.get('user_id'), `eq.${owner}`);
  assertEquals(revalidation?.query.get('deleted_at'), 'is.null');
}));
