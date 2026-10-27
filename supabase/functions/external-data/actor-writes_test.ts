import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { withHandler } from '../_shared/edge-test-harness.ts';

const parent = '44444444-4444-4444-8444-444444444444';
const row = '77777777-7777-4777-8777-777777777777';
const jwt = { Authorization: 'Bearer usuario-teste' };
const setup = (base: string) => ({
  EXTERNAL_SUPABASE_URL: base, EXTERNAL_SUPABASE_SERVICE_ROLE_KEY: 'servico-teste',
});

Deno.test('handler encaminha JWT nas quatro escritas e mantém os guards de relação', async () => {
  const writes: string[] = [];
  await withHandler('external-data', async req => {
    const url = new URL(req.url);
    if (req.method === 'GET') return Response.json(url.pathname.endsWith('/contacts') ? [{ id: parent }] : [{ contact_id: parent }]);
    assertEquals(req.headers.get('Authorization'), jwt.Authorization);
    writes.push(req.method);
    if (req.method === 'DELETE') return Response.json([{ id: row }]);
    const data = { id: row, contact_id: parent, ...(await req.json()) };
    return Response.json(req.headers.get('Accept')?.includes('object') ? data : [data]);
  }, async submit => {
    for (const action of ['insert', 'update', 'update_with_version', 'delete']) {
      const res = await submit({ action, table: 'contact_emails', id: row, version: 1,
        record: { contact_id: parent, email: 'prova@example.invalid' }, updates: { email: 'editado@example.invalid' } }, jwt);
      assertEquals(res.status, 200, await res.text());
    }
    const before = writes.length;
    const reparent = await submit({ action: 'update', table: 'contact_emails', id: row,
      updates: { contact_id: '55555555-5555-4555-8555-555555555555' } }, jwt);
    assertEquals(reparent.status, 400); await reparent.body?.cancel();
    assertEquals(writes.length, before);
    assertEquals(writes, ['POST', 'PATCH', 'PATCH', 'DELETE']);
  }, false, setup);
});

Deno.test('handler mantém caminho service_role legítimo sem precheck de usuário', async () => {
  let count = 0;
  await withHandler('external-data', req => {
    assertEquals(req.method, 'PATCH');
    assertEquals(req.headers.get('Authorization'), 'Bearer servico-teste'); count++;
    return Response.json({ id: row });
  }, async submit => {
    const res = await submit({ action: 'update', table: 'contact_emails', id: row, updates: { email: 'servico@example.invalid' } },
      { Authorization: 'Bearer servico-teste' });
    assertEquals(res.status, 200); await res.body?.cancel(); assertEquals(count, 1);
  }, false, setup);
});

Deno.test('handler falha fechado sem origem JWT compatível, sem fallback service_role', async () => {
  let count = 0;
  await withHandler('external-data', () => { count++; return Response.json([]); }, async submit => {
    for (const action of ['insert', 'update', 'update_with_version', 'delete']) {
      const res = await submit({ action, table: 'contacts', id: parent, version: 1,
        updates: { notes: 'negado' }, record: { first_name: 'Negado' } }, jwt);
      assertEquals(res.status, 503); await res.body?.cancel();
    }
    const invalid = await submit({ action: 'update', table: 'desconhecida', id: parent, updates: { notes: 'negado' } }, jwt);
    assertEquals(invalid.status, 400); await invalid.body?.cancel();
    assertEquals(count, 0);
  }, false, base => ({ ...setup(base), EXTERNAL_SUPABASE_URL: 'http://127.0.0.1:1' }));
});

Deno.test('handler converte recusa do guard após precheck e não mascara conflito SQL', async () => {
  let code = '42501';
  await withHandler('external-data', req => {
    if (req.method === 'GET') return Response.json(new URL(req.url).pathname.endsWith('/contacts') ? [{ id: parent }] : [{ contact_id: parent }]);
    assertEquals(req.headers.get('Authorization'), jwt.Authorization);
    if (code === 'vazio') return Response.json([]);
    return Response.json({ code, message: 'recusa simulada' }, { status: 403 });
  }, async submit => {
    for (const [errorCode, status] of [['42501', 403], ['40001', 409], ['40P01', 409], ['55P03', 409]] as const) {
      code = errorCode;
      for (const action of ['update', 'update_with_version']) {
        const res = await submit({ action, table: 'contact_emails', id: row, version: 1, updates: { email: 'negado@example.invalid' } }, jwt);
        assertEquals(res.status, status);
        const payload = await res.json();
        assertEquals(payload.error, status === 403 ? 'Forbidden' : 'WRITE_CONFLICT');
        if (status === 409) {
          assertEquals(payload.retryable, true);
          assertEquals(payload.sqlState, errorCode);
        }
      }
    }
    const unauth = await submit({ action: 'delete', table: 'contact_emails', id: row });
    assertEquals(unauth.status, 401); assert((await unauth.text()).includes('Unauthorized'));
    code = 'vazio';
    const invisible = await submit({ action: 'delete', table: 'contact_emails', id: row }, jwt);
    assertEquals(invisible.status, 403); await invisible.body?.cancel();
  }, false, setup);
});
