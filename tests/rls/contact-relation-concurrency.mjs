// Executar somente em clone local descartável: AUT03_ISOLATED=1 PGDATABASE=aut03_... node este-arquivo.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const host = process.env.PGHOST ?? '127.0.0.1';
assert.equal(process.env.AUT03_ISOLATED, '1', 'Exige confirmação de banco local isolado');
assert.match(process.env.PGDATABASE ?? '', /^aut03_[a-z0-9_]+$/);
assert.match(host, /^(127\.0\.0\.1|localhost|::1|172\.17\.\d+\.\d+|\/[^\s]+)$/);
const clients = [];
const counters = { cenarios: 0, barreiras_pg_locks: 0 };
const A = randomUUID(), B = randomUUID(), ADMIN = randomUUID();
const P = randomUUID(), Q = randomUUID(), OTHER = randomUUID(), E = randomUUID();
const actors = {
  a1: ['authenticated', A, 'aal1'], a2: ['authenticated', A, 'aal2'],
  b: ['authenticated', B, 'aal1'], m1: ['authenticated', ADMIN, 'aal1'],
  m2: ['authenticated', ADMIN, 'aal2'], anon: ['anon', null, 'aal1'],
  svc: ['service_role', null, 'aal1'],
};
async function connect() {
  const c = new pg.Client({ host, connectionTimeoutMillis: 5000 });
  await c.connect(); clients.push(c);
  await c.query("SET statement_timeout='8s'; SET idle_in_transaction_session_timeout='15s'");
  return c;
}
function pass(name) { counters.cenarios++; console.log('OK', name); }
async function begin(c, actor, isolation = 'READ COMMITTED') {
  const [role, uid, aal] = actors[actor];
  await c.query(`BEGIN ISOLATION LEVEL ${isolation}`);
  await c.query(`SET LOCAL ROLE ${role}`);
  await c.query("SELECT set_config('request.jwt.claims',$1,true),set_config('request.jwt.claim.sub',$2,true)",
    [JSON.stringify({ role, sub: uid, aal }), uid ?? '']);
}
const outcome = promise => promise.then(r => ({ rows: r.rows, n: r.rowCount }), e => ({ code: e.code }));
async function barrier(observer, waiter, blocker) {
  for (let n = 0; n < 250; n++) {
    const { rows } = await observer.query(`SELECT a.wait_event_type,l.locktype,l.mode
      FROM pg_stat_activity a JOIN pg_locks l ON l.pid=a.pid
      WHERE a.pid=$1 AND $2=ANY(pg_blocking_pids(a.pid))
        AND a.wait_event_type='Lock' AND NOT l.granted`, [waiter.processID, blocker.processID]);
    if (rows.length) {
      counters.barreiras_pg_locks++;
      console.log('BARREIRA', JSON.stringify(rows[0])); return;
    }
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.fail('Não houve barreira comprovada em pg_locks');
}
let root, first, second, relationVersion = false;
async function reset() {
  await root.query('DELETE FROM public.contact_emails WHERE contact_id=ANY($1::uuid[])', [[P, Q, OTHER]]);
  await root.query('UPDATE public.contacts SET user_id=$1,deleted_at=NULL WHERE id=ANY($2::uuid[])', [A, [P, Q]]);
  await root.query("INSERT INTO public.contact_emails(id,contact_id,email) VALUES($1,$2,'antes@example.invalid')", [E, P]);
}
async function mutation(c, op) {
  if (op === 'insert') return c.query("INSERT INTO public.contact_emails(contact_id,email) VALUES($1,'inserido@example.invalid') RETURNING id", [P]);
  if (op === 'delete') return c.query('DELETE FROM public.contact_emails WHERE id=$1 RETURNING id', [E]);
  if (op === 'reparent') return c.query('UPDATE public.contact_emails SET contact_id=$1 WHERE id=$2 RETURNING id', [Q, E]);
  // Exercita a variante versionada e, no snapshot legado, o token MVCC xmin.
  const column = relationVersion ? 'version' : 'xmin::text';
  const predicate = op === 'versioned' ? ` AND ${column}=$2` : '';
  const values = op === 'versioned' ? [E, (await root.query(`SELECT ${column} AS v FROM public.contact_emails WHERE id=$1`, [E])).rows[0].v] : [E];
  return c.query(`UPDATE public.contact_emails SET email='editado@example.invalid' WHERE id=$1${predicate} RETURNING id`, values);
}
async function finalState(op, changed) {
  assert.equal((await root.query('SELECT user_id FROM public.contacts WHERE id=$1', [P])).rows[0].user_id, B);
  const rows = (await root.query('SELECT contact_id,email FROM public.contact_emails WHERE contact_id=ANY($1::uuid[]) ORDER BY email', [[P, Q]])).rows;
  if (!changed) { assert.deepEqual(rows, [{ contact_id: P, email: 'antes@example.invalid' }]); return; }
  if (op === 'insert') assert.equal(rows.length, 2);
  if (op === 'delete') assert.equal(rows.length, 0);
  if (op === 'reparent') assert.deepEqual(rows, [{ contact_id: Q, email: 'antes@example.invalid' }]);
  if (['update', 'versioned'].includes(op)) assert.deepEqual(rows, [{ contact_id: P, email: 'editado@example.invalid' }]);
}
try {
  root = await connect(); first = await connect(); second = await connect();
  assert.equal((await root.query('SELECT current_database() AS db')).rows[0].db, process.env.PGDATABASE);
  relationVersion = (await root.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contact_emails' AND column_name='version'")).rowCount > 0;
  console.log('CONDIÇÃO OTIMISTA DA RELAÇÃO', relationVersion ? 'version (variante local)' : 'xmin (snapshot legado)');
  await root.query(`INSERT INTO auth.users(id,email,raw_user_meta_data)
    SELECT x,x::text||'@aut03.example.invalid','{"first_name":"AUT03"}'::jsonb FROM unnest($1::uuid[]) x`, [[A, B, ADMIN]]);
  await root.query("INSERT INTO public.user_roles(user_id,role) VALUES($1,'admin')", [ADMIN]);
  await root.query(`INSERT INTO public.contacts(id,user_id,first_name,last_name)
    VALUES($1,$4,'AUT03','P'),($2,$4,'AUT03','Q'),($3,$5,'AUT03','B')`, [P, Q, OTHER, A, B]);
  assert.equal((await root.query('SELECT count(*)::int AS n FROM auth.users WHERE id=ANY($1::uuid[])', [[A, B, ADMIN]])).rows[0].n, 3);
  assert.equal((await root.query("SELECT bool_or(has_function_privilege(r,'public.guard_contact_relation_write()','EXECUTE')) AS granted FROM unnest(ARRAY['anon','authenticated','service_role']) r")).rows[0].granted, false);
  pass('auth.users reais e função SECURITY DEFINER sem EXECUTE pelos clientes');
  const ops = ['update', 'insert', 'delete', 'reparent', 'versioned'];
  for (const actor of ['a1', 'a2', 'm2', 'svc']) for (const op of ops) {
    for (const transferFirst of [true, false]) {
      await reset();
      if (transferFirst) {
        await begin(first, 'svc');
        await first.query('UPDATE public.contacts SET user_id=$1 WHERE id=$2', [B, P]);
        await begin(second, actor);
        const pending = outcome(mutation(second, op));
        await barrier(root, second, first);
        await first.query('COMMIT');
        const r = await pending;
        if (actor.startsWith('a')) { assert.equal(r.code, '42501'); await second.query('ROLLBACK'); }
        else { assert.equal(r.n, 1); await second.query('COMMIT'); }
        await finalState(op, !actor.startsWith('a'));
      } else {
        await begin(first, actor);
        assert.equal((await mutation(first, op)).rowCount, 1);
        await begin(second, 'svc');
        const pending = outcome(second.query('UPDATE public.contacts SET user_id=$1 WHERE id=$2', [B, P]));
        await barrier(root, second, first);
        await first.query('COMMIT'); assert.equal((await pending).n, 1); await second.query('COMMIT');
        await finalState(op, true);
      }
      if (actor === 'a1' && op === 'update') {
        await begin(first, 'b');
        const visible = await first.query('SELECT email FROM public.contact_emails WHERE id=$1', [E]);
        assert.equal(visible.rows[0]?.email, transferFirst ? 'antes@example.invalid' : 'editado@example.invalid');
        await first.query('ROLLBACK');
        await begin(first, 'a1');
        assert.equal((await first.query('SELECT id FROM public.contact_emails WHERE id=$1', [E])).rowCount, 0);
        const stale = await outcome(first.query("UPDATE public.contact_emails SET email='antigo@example.invalid' WHERE id=$1 RETURNING id", [E]));
        assert.ok(stale.code === '42501' || stale.n === 0);
        await first.query('ROLLBACK');
      }
      pass(`${actor}/${op}/${transferFirst ? 'transferência-primeiro' : 'edição-primeiro'}`);
    }
  }
  for (const actor of ['b', 'm1', 'anon']) for (const op of ops) {
    await reset(); await begin(first, actor);
    const r = await outcome(mutation(first, op));
    assert.ok(r.code === '42501' || r.n === 0, `${actor}/${op}: não pode gravar`);
    await first.query('ROLLBACK');
    assert.equal((await root.query('SELECT email FROM public.contact_emails WHERE id=$1', [E])).rows[0].email, 'antes@example.invalid');
    pass(`negação ${actor}/${op}`);
  }
  for (const op of ops) {
    await reset(); await begin(first, 'svc');
    await first.query('UPDATE public.contacts SET user_id=$1 WHERE id=$2', [B, P]);
    await begin(second, 'a1'); const pending = outcome(mutation(second, op));
    await barrier(root, second, first); await first.query('ROLLBACK');
    assert.equal((await pending).n, 1); await second.query('ROLLBACK');
    assert.equal((await root.query('SELECT user_id FROM public.contacts WHERE id=$1', [P])).rows[0].user_id, A);
    assert.equal((await root.query('SELECT email FROM public.contact_emails WHERE id=$1', [E])).rows[0].email, 'antes@example.invalid');
    pass(`transferência revertida revalida dono original/${op}`);
    await reset(); await begin(first, 'svc');
    await first.query('UPDATE public.contacts SET deleted_at=now() WHERE id=$1', [P]);
    await begin(second, 'a1'); const archived = outcome(mutation(second, op));
    await barrier(root, second, first); await first.query('COMMIT');
    assert.equal((await archived).code, '42501'); await second.query('ROLLBACK');
    assert.equal((await root.query('SELECT email FROM public.contact_emails WHERE id=$1', [E])).rows[0].email, 'antes@example.invalid');
    pass(`arquivamento concorrente revalidado após espera/${op}`);
  }
  await reset(); await root.query('UPDATE public.contacts SET user_id=$1 WHERE id=$2', [B, P]);
  await begin(first, 'b'); assert.equal((await mutation(first, 'update')).rowCount, 1); await first.query('ROLLBACK');
  pass('B pode editar depois da transferência e ROLLBACK não persiste');
  await reset(); await begin(first, 'a1'); await mutation(first, 'update'); await begin(second, 'svc');
  const rolled = outcome(second.query('UPDATE public.contacts SET user_id=$1 WHERE id=$2', [B, P]));
  await barrier(root, second, first); await first.query('ROLLBACK'); assert.equal((await rolled).n, 1);
  await second.query('COMMIT'); await finalState('update', false); pass('edição revertida libera transferência sem escrita parcial');
  // Em REPEATABLE READ, um snapshot antigo deve falhar fechado com erro de serialização.
  await reset(); await begin(first, 'svc'); await first.query('UPDATE public.contacts SET user_id=$1 WHERE id=$2', [B, P]);
  await begin(second, 'a1', 'REPEATABLE READ');
  const repeatable = outcome(mutation(second, 'update')); await barrier(root, second, first);
  await first.query('COMMIT'); assert.equal((await repeatable).code, '40001'); await second.query('ROLLBACK');
  await finalState('update', false); pass('REPEATABLE READ rejeita snapshot obsoleto com 40001');
  for (const target of [OTHER, null, randomUUID()]) {
    await reset(); await begin(first, 'a1');
    const r = await outcome(first.query('UPDATE public.contact_emails SET contact_id=$1 WHERE id=$2', [target, E]));
    assert.equal(r.code, '42501'); await first.query('ROLLBACK'); pass('reparent negado: outro dono/nulo/pai inexistente');
  }
  for (const actor of ['a1', 'm1', 'm2', 'svc']) {
    await reset(); await root.query('UPDATE public.contacts SET deleted_at=now() WHERE id=$1', [P]);
    await begin(first, actor); const r = await outcome(mutation(first, 'insert'));
    if (['m2', 'svc'].includes(actor)) assert.equal(r.n, 1); else assert.equal(r.code, '42501');
    await first.query('ROLLBACK'); pass(`arquivado/${actor}`);
  }
  // Alegar service_role no JSON não transforma o papel SQL authenticated em serviço.
  await reset(); await begin(first, 'b');
  await first.query("SELECT set_config('request.jwt.claims',$1,true)", [JSON.stringify({ sub: B, role: 'service_role', aal: 'aal2' })]);
  assert.equal((await outcome(mutation(first, 'insert'))).code, '42501'); await first.query('ROLLBACK'); pass('identidade SQL impede bypass por claim de serviço');
  await reset(); await begin(first, 'a1');
  await first.query("SELECT set_config('request.jwt.claims','{}',true),set_config('request.jwt.claim.sub','',true)");
  assert.equal((await outcome(mutation(first, 'insert'))).code, '42501');
  await first.query('ROLLBACK'); pass('authenticated sem auth.uid falha fechado');
  for (const [table, extra] of [['contact_phones', ",numero,numero_normalizado"], ['contact_addresses', ''], ['contact_social_media', ',plataforma']]) {
    await reset(); await begin(first, 'svc'); await first.query('UPDATE public.contacts SET user_id=$1 WHERE id=$2', [B, P]);
    await begin(second, 'a1');
    const value = table === 'contact_phones' ? ",'11999998888','11999998888'" : table === 'contact_social_media' ? ",'linkedin'" : '';
    const pending = outcome(second.query(`INSERT INTO public.${table}(contact_id${extra}) VALUES($1${value})`, [P]));
    await barrier(root, second, first); await first.query('COMMIT'); assert.equal((await pending).code, '42501');
    await second.query('ROLLBACK'); pass(`guard concorrente ${table}`);
  }
  await reset(); await begin(first, 'a1');
  assert.equal((await first.query('DELETE FROM public.contacts WHERE id=$1', [P])).rowCount, 1);
  await first.query('ROLLBACK'); assert.equal((await root.query('SELECT count(*)::int AS n FROM public.contact_emails WHERE id=$1', [E])).rows[0].n, 1);
  pass('DELETE físico autorizado preserva FK CASCADE e rollback');
  // Ordem OLD/NEW: reparent oposto bloqueia no pai menor, não cria ciclo de locks.
  await reset(); const e2 = randomUUID();
  await root.query("INSERT INTO public.contact_emails(id,contact_id,email) VALUES($1,$2,'segundo@example.invalid')", [e2, Q]);
  await begin(first, 'a1'); await first.query('UPDATE public.contact_emails SET contact_id=$1 WHERE id=$2', [Q, E]);
  await begin(second, 'a1'); const opposite = outcome(second.query('UPDATE public.contact_emails SET contact_id=$1 WHERE id=$2', [P, e2]));
  await barrier(root, second, first); await first.query('COMMIT'); assert.equal((await opposite).n, 1); await second.query('COMMIT');
  pass('reparent oposto com pais ordenados não deadlocka');
  // Transações multioperação ainda podem deadlockar: a vítima deve reverter integralmente.
  await reset(); await root.query("INSERT INTO public.contact_emails(id,contact_id,email) VALUES($1,$2,'segundo@example.invalid')", [e2, Q]);
  await begin(first, 'a1'); await begin(second, 'a1');
  await first.query("UPDATE public.contact_emails SET email='tx1@example.invalid' WHERE id=$1", [E]);
  await second.query("UPDATE public.contact_emails SET email='tx2@example.invalid' WHERE id=$1", [e2]);
  const d1 = outcome(first.query("UPDATE public.contact_emails SET email='tx1@example.invalid' WHERE id=$1", [e2]));
  await barrier(root, first, second);
  const d2 = outcome(second.query("UPDATE public.contact_emails SET email='tx2@example.invalid' WHERE id=$1", [E]));
  const dead = await Promise.all([d1, d2]); assert.equal(dead.filter(r => r.code === '40P01').length, 1);
  await first.query(dead[0].code ? 'ROLLBACK' : 'COMMIT'); await second.query(dead[1].code ? 'ROLLBACK' : 'COMMIT');
  const winner = dead[0].code ? 'tx2@example.invalid' : 'tx1@example.invalid';
  assert.ok((await root.query('SELECT email FROM public.contact_emails WHERE id=ANY($1::uuid[])', [[E, e2]])).rows.every(r => r.email === winner));
  pass('deadlock multioperação 40P01 aborta vítima inteira');
  await reset();
  const version = (await root.query('SELECT version FROM public.contacts WHERE id=$1', [P])).rows[0].version;
  await begin(first, 'a1'); assert.equal((await first.query('UPDATE public.contacts SET notes=$1 WHERE id=$2 AND version=$3', ['versionado', P, version])).rowCount, 1);
  await begin(second, 'a1'); const stale = outcome(second.query('UPDATE public.contacts SET notes=$1 WHERE id=$2 AND version=$3', ['obsoleto', P, version]));
  await barrier(root, second, first); await first.query('COMMIT'); assert.equal((await stale).n, 0); await second.query('COMMIT');
  assert.equal((await root.query('SELECT notes FROM public.contacts WHERE id=$1', [P])).rows[0].notes, 'versionado');
  pass('version real de contacts aceita uma edição concorrente e rejeita a obsoleta');
  if (relationVersion) {
    await reset(); const v = (await root.query('SELECT version FROM public.contact_emails WHERE id=$1', [E])).rows[0].version;
    await begin(first, 'a1'); await mutation(first, 'versioned'); await begin(second, 'a1');
    const pending = outcome(second.query("UPDATE public.contact_emails SET email='obsoleto@example.invalid' WHERE id=$1 AND version=$2", [E, v]));
    await barrier(root, second, first); await first.query('COMMIT'); assert.equal((await pending).n, 0); await second.query('COMMIT');
    const final = (await root.query('SELECT email,version FROM public.contact_emails WHERE id=$1', [E])).rows[0];
    assert.equal(final.version, v + 1); assert.equal(final.email, 'editado@example.invalid');
    pass('variante local versionada preserva incremento único e rejeita versão obsoleta');
  }
} finally {
  for (const c of clients) await c.query('ROLLBACK').catch(() => {});
  if (root) {
    await root.query('DELETE FROM public.contacts WHERE id=ANY($1::uuid[])', [[P, Q, OTHER]]);
    await root.query('DELETE FROM public.user_roles WHERE user_id=ANY($1::uuid[])', [[A, B, ADMIN]]);
    await root.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])', [[A, B, ADMIN]]);
    assert.equal((await root.query('SELECT count(*)::int AS n FROM auth.users WHERE id=ANY($1::uuid[])', [[A, B, ADMIN]])).rows[0].n, 0);
    assert.equal((await root.query('SELECT count(*)::int AS n FROM public.contacts WHERE id=ANY($1::uuid[])', [[P, Q, OTHER]])).rows[0].n, 0);
    assert.equal((await root.query('SELECT count(*)::int AS n FROM pg_stat_activity WHERE pid=ANY($1::int[]) AND xact_start IS NOT NULL', [[first.processID, second.processID]])).rows[0].n, 0);
    pass('limpeza remove contas e contatos da fixture');
  }
  await Promise.all(clients.map(c => c.end()));
  console.log('RESULTADO', JSON.stringify(counters));
}
