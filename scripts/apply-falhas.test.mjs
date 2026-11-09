// Modos de falha dos aplicadores de DDL: rede, timeout, 429/5xx, credencial, falha parcial, entrada
// malformada/ausente/enorme, sinal e saída fechada. Sem banco: a API é um servidor local com falhas injetadas.
// Rodar: node --test scripts/apply-falhas.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gravarDdlDeTeste, iniciarMock, rodarCli } from './lib/mgmt-mock.test.mjs';
import { SQL_CONTAR_TABELAS } from './lib/supabase-mgmt.mjs';

let tmp; let ddl;
before(() => { tmp = mkdtempSync(join(tmpdir(), 'g1-falhas-')); ddl = gravarDdlDeTeste(join(tmp, 'ddl')); });
after(() => rmSync(tmp, { recursive: true, force: true }));
const ehDdl = (c) => c.sql !== SQL_CONTAR_TABELAS && !c.sql.startsWith('SELECT table_schema');
/** Roda `script --apply` contra um mock com `interceptar`; devolve { r, mock } com o mock já fechado. */
async function aplicar(script, interceptar, { env = {}, args = [], dir = ddl, aoIniciar } = {}) {
  const mock = await iniciarMock({ interceptar });
  try { return { r: await rodarCli(script, ['--apply', '--ddl-dir', dir, ...args], { mock, env, cwd: tmp, aoIniciar }), mock }; } finally { await mock.fechar(); }
}

test('429 (com Retry-After) e 500/502/503 são repetidos com backoff e a execução termina bem', async () => {
  const fila = [{ status: 429, cabecalhos: { 'retry-after': '0' } }, { status: 500 }, { status: 502 }, { status: 503 }];
  const { r, mock } = await aplicar('apply-rls.js', (c) => (c.sql.includes('contas_select') ? fila.shift() : null));
  assert.equal(r.codigo, 0, r.stdout);
  assert.deepEqual(mock.chamadas.filter((c) => c.sql.includes('contas_select')).map((c) => c.status), [429, 500, 502, 503, 201]);
  assert.match(r.stdout, /6 ok, 0 já existiam, 0 falharam, 0 não executadas\. Requisições: 12 \(retentativas: 4\)/);
});

test('5xx persistente: desiste após as retentativas, aborta, não envia o resto e sai 1', async () => {
  const { r, mock } = await aplicar('apply-rls.js', (c) => (c.sql.includes('Itens; do Pedido" ENABLE') ? { status: 503 } : null), { env: { SUPABASE_MGMT_RETRIES: '2' } });
  assert.equal(r.codigo, 1);
  assert.equal(mock.chamadas.filter((c) => c.status === 503).length, 3, '1 tentativa + 2 retentativas');
  assert.equal(mock.chamadas.at(-1).status, 503, 'nada é enviado depois do aborto');
  assert.match(r.stdout, /1 ok, 0 já existiam, 0 falharam, 5 não executadas/);
  assert.match(r.stdout, /ABORTADO: desisti após 3 tentativa\(s\): HTTP 503/); assert.match(r.stdout, /Resultado: FALHOU \(código de saída 1\)\n$/);
});

test('timeout: requisição pendurada é abortada e repetida; a instrução acaba aplicada', async () => {
  let primeira = true;
  const { r, mock } = await aplicar('apply-triggers-views.js', (c) => { if (c.sql.includes('contas_toque') && primeira) { primeira = false; return { atrasoMs: 700 }; } return null; },
    { env: { SUPABASE_MGMT_TIMEOUT_MS: '250' } });
  assert.equal(r.codigo, 0, r.stdout);
  assert.ok(mock.chamadas.filter((c) => c.sql.includes('contas_toque')).length >= 2, 'houve reenvio');
  assert.match(r.stdout, /4 ok, 0 já existiam, 0 falharam, 0 não executadas/); assert.match(r.stdout, /retentativas: [1-9]/);
});

test('timeout permanente: aborta com mensagem de timeout e sai 1', async () => {
  const { r } = await aplicar('apply-triggers-views.js', (c) => (ehDdl(c) ? { atrasoMs: 400 } : null), { env: { SUPABASE_MGMT_TIMEOUT_MS: '100', SUPABASE_MGMT_RETRIES: '1' } });
  assert.equal(r.codigo, 1);
  assert.match(r.stdout, /ABORTADO: desisti após 2 tentativa\(s\): timeout após 100 ms/); assert.match(r.stdout, /0 ok, 0 já existiam, 0 falharam, 4 não executadas/);
});

test('conexão derrubada no meio: repete; servidor fora do ar: aborta e sai 1', async () => {
  let quedas = 2;
  const ok = await aplicar('apply-rls.js', (c) => (c.sql.includes('contas_insert') && quedas-- > 0 ? { derrubar: true } : null));
  assert.equal(ok.r.codigo, 0, ok.r.stdout); assert.match(ok.r.stdout, /retentativas: 2/);
  const mock = await iniciarMock(); const url = mock.url; await mock.fechar(); // porta sem ninguém ouvindo
  const fora = await rodarCli('apply-rls.js', ['--apply', '--ddl-dir', ddl], { env: { SUPABASE_MGMT_API_URL: url, SUPABASE_ACCESS_TOKEN: 'token-de-teste-fora-do-ar', SUPABASE_MGMT_RETRIES: '2' }, cwd: tmp });
  assert.equal(fora.codigo, 1);
  assert.match(fora.stdout, /ABORTADO: desisti após 3 tentativa\(s\): erro de rede \(ECONNREFUSED\)/); assert.match(fora.stdout, /0 ok, 0 já existiam, 0 falharam, 6 não executadas/);
});

test('token recusado (401): uma única requisição, nenhum DDL enviado, dica sem expor o token, saída 1', async () => {
  const mock = await iniciarMock({ token: 'o-token-certo' });
  try {
    const r = await rodarCli('apply-all.js', ['--apply', '--ddl-dir', ddl], { env: { SUPABASE_MGMT_API_URL: mock.url, SUPABASE_ACCESS_TOKEN: 'token-errado-123' }, cwd: tmp });
    assert.equal(r.codigo, 1); assert.equal(mock.chamadas.length, 1); assert.equal(mock.chamadas[0].sql, SQL_CONTAR_TABELAS);
    assert.match(r.stdout, /ABORTADO: HTTP 401 — token recusado \(confira SUPABASE_ACCESS_TOKEN\)/); assert.ok(!(r.stdout + r.stderr).includes('token-errado-123'));
  } finally { await mock.fechar(); }
});

test('redirecionamento (302) e 404 abortam sem repetir', async () => {
  for (const status of [302, 404]) {
    const { r, mock } = await aplicar('fix-enums.js', () => ({ status }));
    assert.equal(r.codigo, 1); assert.equal(mock.chamadas.length, 1); assert.match(r.stdout, new RegExp(`ABORTADO: HTTP ${status}`));
  }
});

test('falha parcial: só a instrução recusada falha, as outras entram, saída 1 e o resumo diz qual (arquivo:linha)', async () => {
  const recusa = { status: 400, corpo: { message: 'Failed to run sql query: ERROR:  42883: function public.eh_dono(uuid) does not exist\n' } };
  const { r, mock } = await aplicar('apply-rls.js', (c) => (c.sql.includes('contas_select') ? recusa : null));
  assert.equal(r.codigo, 1);
  assert.equal(mock.chamadas.filter((c) => ehDdl(c) && c.status === 201).length, 5, 'as outras 5 foram aplicadas');
  assert.match(r.stdout, /RESUMO apply-rls\.js: 6 instrução\(ões\) — 5 ok, 0 já existiam, 1 falharam, 0 não executadas/);
  assert.match(r.stdout, /FALHOU 07_policies\.sql:3: Failed to run sql query: ERROR: 42883: function public\.eh_dono\(uuid\) does not exist\n\s+DO \$idem\$ BEGIN CREATE POLICY contas_select/);
  assert.match(r.stdout, /Resultado: FALHOU \(código de saída 1\)\n$/);
});

test('falha parcial em lote (chunk-apply): o lote é reenviado 1 a 1 e só a culpada é relatada', async () => {
  const recusa = { status: 400, corpo: { message: 'Failed to run sql query: ERROR:  42P01: relation "public.nao_existe" does not exist\n' } };
  const { r, mock } = await aplicar('chunk-apply.js', (c) => (c.sql.includes('idx_contas_user') ? recusa : null));
  assert.equal(r.codigo, 1);
  assert.match(r.stdout, /lote recusado pelo banco; reenviado 1 a 1: 2 ok, 1 falharam/);
  assert.match(r.stdout, /40 instrução\(ões\) — 39 ok, 0 já existiam, 1 falharam, 0 não executadas/);
  assert.match(r.stdout, /FALHOU 03_indexes\.sql:3: .*42P01.*\n\s+CREATE INDEX IF NOT EXISTS idx_contas_user/);
  assert.ok(mock.chamadas.some((c) => c.sql === 'CREATE UNIQUE INDEX IF NOT EXISTS idx_contas_nome ON public.contas USING btree (public.sem_acento(nome));'), 'vizinhas reenviadas sozinhas');
});

test('apply-migrations.js: arquivo recusado falha inteiro (atômico), os demais seguem, saída 1', async () => {
  const recusa = { status: 400, corpo: { message: 'Failed to run sql query: ERROR:  0A000: cannot use column reference in DEFAULT expression\n' } };
  const { r, mock } = await aplicar('apply-migrations.js', (c) => (c.sql.includes('CREATE TABLE IF NOT EXISTS public.contas') ? recusa : null));
  assert.equal(r.codigo, 1);
  assert.ok(!mock.chamadas.some((c) => /^CREATE TABLE IF NOT EXISTS public\."Itens/.test(c.sql)), 'nunca reparte o arquivo');
  assert.match(r.stdout, /41 instrução\(ões\) — 33 ok, 0 já existiam, 8 falharam, 0 não executadas/);
  assert.match(r.stdout, /FALHOU 02_tables\.sql:6 \(arquivo atômico: nada dele foi aplicado, 8 instruções\): .*0A000/);
});

test('"já existe" devolvido pelo banco (42P07) conta como já existia, não como falha', async () => {
  const jaExiste = { status: 400, corpo: { message: 'Failed to run sql query: ERROR:  42P07: relation "v_itens" already exists\n' } };
  const { r } = await aplicar('apply-triggers-views.js', (c) => (c.sql.includes('v_itens') ? jaExiste : null));
  assert.equal(r.codigo, 0, r.stdout); assert.match(r.stdout, /3 ok, 1 já existiam, 0 falharam/);
});

test('o servidor devolvendo o token na mensagem de erro não o faz aparecer na saída', async () => {
  const { r, mock } = await aplicar('apply-rls.js', (c) => (ehDdl(c) ? { status: 400, corpo: { message: `ERROR:  42601: eco Bearer ${c.autorizacao.slice(7)} fim` } } : null));
  assert.equal(r.codigo, 1); assert.ok(!(r.stdout + r.stderr).includes(mock.token)); assert.match(r.stdout, /eco Bearer \*\*\* fim/);
});

test('corpo de sucesso que não é JSON e contagem ilegível não derrubam o script', async () => {
  const { r } = await aplicar('fix-enums.js', () => ({ status: 200, corpo: '<html>ok</html>' }));
  assert.equal(r.codigo, 0, r.stdout + r.stderr); assert.match(r.stdout, /Tabelas em public antes: indisponível/); assert.match(r.stdout, /7 ok, 0 já existiam, 0 falharam/);
});

for (const [nome, trocas, erro] of [
  ['dollar-quote sem fim', { '08_functions.sql': 'CREATE FUNCTION f() RETURNS int AS $f$ BEGIN RETURN 1; END;' }, /08_functions\.sql: SQL malformado: dollar-quote \$f\$ sem fechamento \(aberto na linha 1\)/],
  ['string sem fim', { '10_views.sql': "-- v\nCREATE VIEW v AS SELECT 'abc;" }, /10_views\.sql: SQL malformado: string '\.\.\.' sem fechamento \(aberto na linha 2\)/],
  ['arquivo ausente', { '09_triggers.sql': null }, /não consegui ler .*09_triggers\.sql \(ENOENT\)/],
]) {
  test(`entrada ruim (${nome}): sai 2 e NADA é enviado, nem dos arquivos bons`, async () => {
    const dir = gravarDdlDeTeste(join(tmp, `ruim ${nome}`), trocas);
    const { r, mock } = await aplicar('apply-functions.js', null, { dir });
    assert.equal(r.codigo, 2); assert.match(r.stderr, erro); assert.match(r.stderr, /Nada foi enviado/); assert.equal(mock.chamadas.length, 0);
    assert.equal((await rodarCli('apply-functions.js', ['--ddl-dir', dir], { cwd: tmp })).codigo, 2, 'a simulação também acusa');
  });
}

test('arquivo ilegível (diretório no lugar do .sql) e --ddl-dir inexistente saem 2 sem requisição', async () => {
  const dir = gravarDdlDeTeste(join(tmp, 'ilegivel'), { '06_rls_enable.sql': null });
  mkdirSync(join(dir, '06_rls_enable.sql'));
  const a = await aplicar('apply-rls.js', null, { dir });
  assert.equal(a.r.codigo, 2); assert.match(a.r.stderr, /06_rls_enable\.sql \(EISDIR\)/); assert.equal(a.mock.chamadas.length, 0);
  const b = await aplicar('apply-rls.js', null, { dir: join(tmp, 'não existe') });
  assert.equal(b.r.codigo, 2); assert.match(b.r.stderr, /ENOENT/); assert.equal(b.mock.chamadas.length, 0);
});

test('arquivos vazios ou só com comentários: nada a enviar, saída 0', async () => {
  const dir = gravarDdlDeTeste(join(tmp, 'vazio'), { '09_triggers.sql': '', '10_views.sql': '-- Generated\n\n-- pg_cron não disponível; nada aqui\n/* nem aqui; */\n' });
  const { r, mock } = await aplicar('apply-triggers-views.js', null, { dir });
  assert.equal(r.codigo, 0, r.stdout); assert.equal(mock.chamadas.filter(ehDdl).length, 0); assert.match(r.stdout, /0 instrução\(ões\) — 0 ok/);
});

test('entrada enorme: 6000 instruções em lotes de 40 (150 POSTs) aplicadas em poucos segundos', async () => {
  const linhas = Array.from({ length: 6000 }, (_, i) => `CREATE INDEX idx_${i} ON public.contas USING btree (user_id); -- ; ${i}`);
  const dir = gravarDdlDeTeste(join(tmp, 'enorme'), Object.fromEntries(['01_schemas_and_enums.sql', '02_tables.sql', '11_partitions.sql', '04_foreign_keys.sql', '05_grants.sql', '06_rls_enable.sql', '07_policies.sql', '08_functions.sql', '09_triggers.sql', '10_views.sql'].map((f) => [f, '']).concat([['03_indexes.sql', linhas.join('\n')]])));
  const t0 = Date.now();
  const { r, mock } = await aplicar('chunk-apply.js', null, { dir });
  assert.equal(r.codigo, 0, r.stderr); assert.equal(mock.chamadas.filter(ehDdl).length, 150); assert.match(r.stdout, /6000 ok, 0 já existiam, 0 falharam/);
  assert.ok(Date.now() - t0 < 15000);
});

test('apply-missing.js: só cria o que falta; se não conseguir listar as tabelas, não cria nada e sai 1', async () => {
  const existentes = [{ table_schema: 'public', table_name: 'contas' }, { table_schema: 'public', table_name: 'Itens; do Pedido' }, { table_schema: 'outro', table_name: 'audit_log' }];
  const { r, mock } = await aplicar('apply-missing.js', (c) => (c.sql.startsWith('SELECT table_schema') ? { status: 201, corpo: existentes } : null));
  assert.equal(r.codigo, 0, r.stdout);
  const criadas = mock.chamadas.filter(ehDdl).map((c) => /^CREATE TABLE IF NOT EXISTS (\S+|"[^"]+"\S*)/.exec(c.sql)[1]);
  assert.deepEqual(criadas, ['public.audit_log', 'public.entity_relationships', 'public.error_logs', 'public.proximo_passo_feedback', 'public.validation_queue', 'public.audit_log_2026_11', 'public.audit_log_default']);
  assert.match(r.stdout, /7 tabela\(s\) faltando de 9/);
  const falha = await aplicar('apply-missing.js', (c) => (c.sql.startsWith('SELECT table_schema') ? { status: 500 } : null), { env: { SUPABASE_MGMT_RETRIES: '1' } });
  assert.equal(falha.r.codigo, 1); assert.match(falha.r.stderr, /não consegui listar as tabelas existentes: desisti após 2 tentativa/); assert.equal(falha.mock.chamadas.filter(ehDdl).length, 0);
});

test('retry-failed.js: tabela pedida que não está no arquivo → sai 2 sem enviar as outras', async () => {
  const dir = gravarDdlDeTeste(join(tmp, 'sem tabela'), { '02_tables.sql': 'CREATE TABLE public.error_logs (id integer NOT NULL);\n' });
  const { r, mock } = await aplicar('retry-failed.js', null, { dir });
  assert.equal(r.codigo, 2); assert.match(r.stderr, /não encontrada\(s\) em 02_tables\.sql: entity_relationships, proximo_passo_feedback, validation_queue/); assert.equal(mock.chamadas.length, 0);
});

test('ambiente inválido (ref, URL, token com espaço) sai 2 sem requisição e sem ecoar o token', async () => {
  for (const env of [{ SUPABASE_PROJECT_REF: '../outro/projeto' }, { SUPABASE_MGMT_API_URL: 'http://api.exemplo.com' }, { SUPABASE_ACCESS_TOKEN: 'tok en-secreto' }, { SUPABASE_MGMT_TIMEOUT_MS: 'já' }]) {
    const r = await rodarCli('fix-enums.js', [], { env: { SUPABASE_ACCESS_TOKEN: 'tok', ...env }, cwd: tmp });
    assert.equal(r.codigo, 2, JSON.stringify(env)); assert.ok(!r.stderr.includes('en-secreto'));
  }
});

test('SUPABASE_PROJECT_REF troca o projeto de destino', async () => {
  const { r, mock } = await aplicar('fix-enums.js', null, { env: { SUPABASE_PROJECT_REF: 'abcdefghij0123456789' } });
  assert.equal(r.codigo, 0); assert.ok(mock.chamadas.length > 0 && mock.chamadas.every((c) => c.ref === 'abcdefghij0123456789'));
});

test('Ctrl+C (SIGINT) no meio: termina a requisição em curso, não envia mais, resume e sai 130', async () => {
  let filho; let enviados = 0;
  const { r, mock } = await aplicar('apply-all.js', (c) => { if (ehDdl(c) && ++enviados === 3) { filho.kill('SIGINT'); return { atrasoMs: 150 }; } return null; }, { aoIniciar: (f) => { filho = f; } });
  assert.equal(r.codigo, 130); assert.equal(mock.chamadas.filter(ehDdl).length, 3);
  assert.match(r.stdout, /3 ok, 0 já existiam, 0 falharam, 37 não executadas/); assert.match(r.stdout, /INTERROMPIDO \(SIGINT\)/);
});

test('saída fechada (| head): a simulação termina limpa, sem stack trace', async () => {
  const r = await rodarCli('apply-all.js', ['--sql'], { cwd: tmp, aoIniciar: (f) => f.stdout.once('data', () => f.stdout.destroy()) });
  assert.equal(r.codigo, 0); assert.equal(r.stderr, '');
});
