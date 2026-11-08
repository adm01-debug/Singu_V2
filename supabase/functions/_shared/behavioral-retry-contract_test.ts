import { assert, assertEquals } from 'jsr:@std/assert@1';

type Scenario = 'confirmado' | 'concluida-na-rpc' | 'sem-perfil' | 'falha' | 'substituido' | 'pausa' | 'nao-admin' | 'lenta';
type Operation = { table: string; method: string; body: Record<string, unknown>; query: URLSearchParams };
const owner = '11111111-1111-4111-8111-111111111111';
const contact = '22222222-2222-4222-8222-222222222222';
const token = '33333333-3333-4333-8333-333333333333';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

async function withRetry(scenario: Scenario, test: (response: Response, operations: Operation[]) => Promise<void>) {
  const operations: Operation[] = [];
  const backend = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async req => {
    const url = new URL(req.url);
    const table = url.pathname.split('/').pop()!;
    const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await req.json();
    operations.push({ table, method: req.method, body, query: url.searchParams });
    if (url.pathname === '/auth/v1/user') return json({ id: owner });
    if (table === 'has_role') return json(scenario !== 'nao-admin');
    if (table === 'claim_behavioral_profile_retry') {
      if (scenario === 'pausa') return json({ code: 'P0001', message: 'Reserva vigente' }, 400);
      return json({ contact_id: contact, user_id: owner, claim_token: token, attempts: 2 });
    }
    if (table === 'generate-behavioral-profile') {
      if (scenario === 'lenta') await new Promise(resolve => setTimeout(resolve, 31_000));
      if (scenario === 'falha') return json({ error: 'IA não disponível' }, 503);
      if (scenario === 'substituido') return json({ error: 'Reserva substituída' }, 409);
      return json(scenario === 'sem-perfil' ? { ok: true } : { profile: { contact_id: contact, user_id: owner } });
    }
    if (table === 'behavioral_profile_regen_queue') return json(scenario === 'concluida-na-rpc' || scenario === 'substituido' ? null : { contact_id: contact });
    return json(null);
  });
  const process = new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '--node-modules-dir=none', '--allow-net=127.0.0.1,0.0.0.0:8000', '--allow-env', new URL('../retry-behavioral-profile/index.ts', import.meta.url).pathname],
    clearEnv: true,
    env: { HOME: Deno.env.get('HOME')!, SUPABASE_URL: `http://127.0.0.1:${backend.addr.port}`, SUPABASE_ANON_KEY: 'anon-teste', SUPABASE_SERVICE_ROLE_KEY: 'servico-teste', CRON_SECRET: 'cron-teste' },
    stdout: 'null', stderr: 'inherit',
  }).spawn();
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        const response = await fetch('http://127.0.0.1:8000', { method: 'OPTIONS', signal: AbortSignal.timeout(1_000) });
        await response.arrayBuffer();
        ready = true;
        break;
      } catch { await new Promise(resolve => setTimeout(resolve, 50)); }
    }
    assert(ready, 'Servidor de reanálise não iniciou');
    const response = await fetch('http://127.0.0.1:8000', {
      method: 'POST', headers: { Authorization: 'Bearer usuario-teste', 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_id: contact }),
    });
    await test(response, operations);
  } finally {
    try { process.kill('SIGTERM'); } catch { /* Processo já encerrado. */ }
    await process.status;
    await backend.shutdown();
  }
}

Deno.test('Reanálise: admin reserva e confirma perfil pelo token da transação', () => withRetry('confirmado', async (response, operations) => {
  assertEquals(response.status, 200);
  assertEquals((await response.json()).ok, true);
  assertEquals(operations.find(operation => operation.table === 'claim_behavioral_profile_retry')?.body.p_actor_id, owner);
  const generate = operations.find(operation => operation.table === 'generate-behavioral-profile');
  assertEquals(generate?.body.claim_token, token);
  assertEquals(generate?.body.manual_retry, true);
  assert(!operations.some(operation => operation.table === 'behavioral_profile_regen_queue'));
}));

for (const scenario of ['sem-perfil', 'falha'] as const) {
  Deno.test(`Reanálise: ${scenario} registra falha sem repetir nem zerar tentativas`, () => withRetry(scenario, async (response, operations) => {
    assertEquals(response.status, 502);
    assertEquals((await response.json()).ok, false);
    const failure = operations.find(operation => operation.table === 'behavioral_profile_regen_queue');
    assertEquals(failure?.method, 'PATCH');
    assertEquals(failure?.query.get('claim_token'), `eq.${token}`);
    assert(!Object.hasOwn(failure?.body ?? {}, 'attempts'));
    assert(!operations.some(operation => operation.method === 'DELETE'));
  }));
}

Deno.test('Reanálise: worker substituído não declara conclusão', () => withRetry('substituido', async (response) => {
  assertEquals(response.status, 409);
  assertEquals((await response.json()).ok, false);
}));

Deno.test('Reanálise: exclusão pela RPC conserva a confirmação do perfil', () => withRetry('concluida-na-rpc', async (response, operations) => {
  assertEquals(response.status, 200);
  assertEquals((await response.json()).ok, true);
  assert(!operations.some(operation => operation.table === 'behavioral_profile_regen_queue'));
}));

for (const [scenario, status] of [['pausa', 429], ['nao-admin', 403]] as const) {
  Deno.test(`Reanálise: ${scenario} não invoca IA`, () => withRetry(scenario, async (response, operations) => {
    assertEquals(response.status, status);
    await response.arrayBuffer();
    assert(!operations.some(operation => operation.table === 'generate-behavioral-profile'));
  }));
}

Deno.test('Reanálise: geração confirmada após 31 segundos não perde a reserva', () => withRetry('lenta', async (response, operations) => {
  assertEquals(response.status, 200);
  assertEquals((await response.json()).ok, true);
  assert(!operations.some(operation => operation.table === 'behavioral_profile_regen_queue'));
}));
