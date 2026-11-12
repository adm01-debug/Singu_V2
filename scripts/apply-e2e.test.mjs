// Ponta a ponta dos aplicadores de DDL: cada script roda como CLI contra uma "Management API" local
// (127.0.0.1) que executa o SQL num Postgres 16 LOCAL com stubs do Supabase. Nunca toca a API real.
// Precisa de PGHOST/PGPORT/PGUSER; sem banco os testes se PULAM. Rodar: node --test scripts/apply-e2e.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cfgPg, criarBanco, DDL_DE_TESTE, gravarDdlDeTeste, iniciarMock, pgDisponivel, removerBanco, retrato, rodarCli, sqlLocal } from './lib/mgmt-mock.test.mjs';
import { SQL_CONTAR_TABELAS } from './lib/supabase-mgmt.mjs';

const pular = (await pgDisponivel()) ? false : 'Postgres local indisponível (defina PGHOST/PGPORT/PGUSER)';
const temPsql = spawnSync('psql', ['--version']).status === 0;
const ehDdl = (c) => c.sql !== SQL_CONTAR_TABELAS && !c.sql.startsWith('SELECT table_schema');

// O que o DDL de teste (lib/mgmt-mock.test.mjs) deve deixar no schema public.
const ESPERADO = {
  tabelas: ['Itens; do Pedido', 'audit_log', 'audit_log_2026_11', 'audit_log_default', 'contas', 'entity_relationships', 'error_logs', 'proximo_passo_feedback', 'validation_queue'],
  rls: ['Itens; do Pedido', 'audit_log', 'contas'],
  indices: ['contas_pkey', 'idx_contas_nome', 'idx_contas_user', 'idx_itens_conta', 'itens_pkey'],
  fks: ['itens_conta_fk'],
  funcoes: ['dobro(integer)', 'eh_dono(uuid)', 'sem_acento(text)', 'tocar_atualizacao()'],
  policies: ['Itens; do Pedido: dono\'s; itens', 'contas: contas_insert', 'contas: contas_select'],
  triggers: ['Itens; do Pedido: itens_toque', 'contas: contas_toque'],
  views: ['contas_publicas', 'v_itens'],
  enums: ['app_role', 'entity_relationship_role', 'entity_type', 'error_severity', 'humor', 'passo_outcome', 'validation_kind', 'validation_queue_status'],
  grants: 12,
};
const ENUMS_DO_FIX = ESPERADO.enums.filter((e) => !['app_role', 'humor'].includes(e));

let tmp; let ddl; const bancos = [];
before(() => { tmp = mkdtempSync(join(tmpdir(), 'g1-e2e-')); ddl = gravarDdlDeTeste(join(tmp, 'ddl')); });
after(async () => { for (const b of bancos) await removerBanco(b).catch(() => {}); rmSync(tmp, { recursive: true, force: true }); });
const novoBanco = async (sufixo, opcoes) => { const b = await criarBanco(sufixo, opcoes); bancos.push(b); return b; };
/** Roda `script --apply` num banco; devolve { codigo, stdout, stderr, chamadas }. */
async function aplicar(script, banco, { dir = ddl, interceptar, env } = {}) {
  const mock = await iniciarMock({ banco, interceptar });
  try { const r = await rodarCli(script, ['--apply', '--ddl-dir', dir], { mock, env, cwd: tmp }); return { ...r, chamadas: mock.chamadas }; } finally { await mock.fechar(); }
}
const resumo = (stdout) => /RESUMO .*: (\d+) instrução\(ões\) — (\d+) ok, (\d+) já existiam, (\d+) falharam, (\d+) não executadas/.exec(stdout)?.slice(1).map(Number);

for (const script of ['apply-all.js', 'chunk-apply.js', 'apply-migrations.js']) {
  test(`${script}: banco vazio → aplica tudo; reexecução é idempotente (mesmo banco, saída 0, zero falha)`, { skip: pular }, async () => {
    const banco = await novoBanco('full');
    const r1 = await aplicar(script, banco);
    assert.equal(r1.codigo, 0, r1.stdout + r1.stderr);
    assert.deepEqual(await retrato(banco), ESPERADO);
    assert.match(r1.stdout, /Tabelas em public antes: 0\n/); assert.match(r1.stdout, /Tabelas em public depois: 9 \(\+9\)\n/);
    assert.doesNotMatch(r1.stdout, /\[repescagem/, 'com 08 antes de 03 (99_apply_all.sql), o índice que depende de função entra na 1ª passada');
    const [total, ok, , falharam, naoExec] = resumo(r1.stdout);
    assert.deepEqual([ok, falharam, naoExec], [total, 0, 0]);
    const r2 = await aplicar(script, banco);
    assert.equal(r2.codigo, 0, r2.stdout);
    assert.deepEqual(await retrato(banco), ESPERADO, 'nada mudou');
    assert.deepEqual(resumo(r2.stdout), [total, total, 0, 0, 0]);
    assert.ok(r2.chamadas.every((c) => c.status === 201), 'na 2ª vez o banco não recusa nenhuma instrução');
    assert.match(r2.stdout, /Tabelas em public depois: 9 \(\+0\)\n/);
    // Conteúdo, não só nomes: comentário com ; , default com ; e função com $q$ chegaram intactos.
    const [l] = await sqlLocal(banco, "SELECT obj_description('public.contas'::regclass) AS c, (SELECT column_default FROM information_schema.columns WHERE table_name = 'contas' AND column_name = 'nome') AS d, (SELECT prosrc FROM pg_proc WHERE proname = 'tocar_atualizacao') AS f, public.dobro(21) AS n");
    assert.equal(l.c, 'Contas; com ponto e vírgula'); assert.equal(l.d, "'sem; nome'::text"); assert.match(l.f, /PERFORM 'a;b', \$q\$ interno; \$\$ \$q\$;/); assert.equal(l.n, 42);
  });
}

test('o SQL impresso por --sql, executado pelo psql (divisor independente), dá o mesmo banco que --apply', { skip: pular || (temPsql ? false : 'psql não está no PATH') }, async () => {
  const banco = await novoBanco('psql');
  const { stdout } = await rodarCli('apply-all.js', ['--sql', '--ddl-dir', ddl], { cwd: tmp });
  const arquivo = join(tmp, 'gerado.sql'); writeFileSync(arquivo, stdout);
  const c = cfgPg();
  const psql = () => spawnSync('psql', ['-X', '-q', '-h', c.host, '-p', String(c.port), '-U', c.user, '-d', banco, '-f', arquivo], { encoding: 'utf8', env: { ...process.env, PGPASSWORD: c.password } });
  const erros = (r) => r.stderr.split('\n').filter((l) => /ERROR:/.test(l));
  const p1 = psql();
  assert.deepEqual(erros(p1).map((l) => l.replace(/^.*ERROR: +/, '')), [], 'com 08 antes de 03 (99_apply_all.sql), nada falha na 1ª passada');
  assert.deepEqual(erros(psql()), [], '2ª passada limpa: o SQL gerado é idempotente');
  assert.deepEqual(await retrato(banco), ESPERADO);
});

test('fix-enums → retry-failed → apply-missing → apply-remaining reconstroem o banco; cada passo é idempotente', { skip: pular }, async () => {
  const banco = await novoBanco('cadeia');
  const fix = await aplicar('fix-enums.js', banco);
  assert.equal(fix.codigo, 0, fix.stdout);
  let r = await retrato(banco);
  assert.deepEqual(r.enums, ENUMS_DO_FIX); assert.deepEqual(r.tabelas, ['system_alerts']);
  assert.deepEqual(resumo((await aplicar('fix-enums.js', banco)).stdout), [7, 7, 0, 0, 0], 'fix-enums 2ª vez');

  const retry = await aplicar('retry-failed.js', banco);
  assert.equal(retry.codigo, 0, retry.stdout);
  assert.deepEqual((await retrato(banco)).tabelas, ['entity_relationships', 'error_logs', 'proximo_passo_feedback', 'system_alerts', 'validation_queue']);
  assert.equal((await aplicar('retry-failed.js', banco)).codigo, 0, 'retry-failed 2ª vez');

  const missing = await aplicar('apply-missing.js', banco);
  assert.equal(missing.codigo, 0, missing.stdout);
  assert.match(missing.stdout, /5 tabela\(s\) faltando de 9/);
  assert.deepEqual(missing.chamadas.filter(ehDdl).map((c) => /EXISTS public\.("[^"]+"|\w+)/.exec(c.sql)[1]), ['contas', '"Itens; do Pedido"', 'audit_log', 'audit_log_2026_11', 'audit_log_default']);
  const missing2 = await aplicar('apply-missing.js', banco);
  assert.equal(missing2.codigo, 0); assert.match(missing2.stdout, /0 tabela\(s\) faltando de 9/); assert.equal(missing2.chamadas.filter(ehDdl).length, 0, 'nada a criar na 2ª vez');

  const modelo = banco; // estado "só tabelas", reaproveitado pelos testes abaixo
  const resto = await novoBanco('resto', { modelo });
  const rem = await aplicar('apply-remaining.js', resto);
  assert.equal(rem.codigo, 0, rem.stdout);
  const final = await retrato(resto);
  assert.deepEqual(final, { ...ESPERADO, enums: ENUMS_DO_FIX, tabelas: [...ESPERADO.tabelas, 'system_alerts'].sort(), indices: [...ESPERADO.indices, 'system_alerts_pkey'].sort() });
  const rem2 = await aplicar('apply-remaining.js', resto);
  assert.equal(rem2.codigo, 0); assert.deepEqual(await retrato(resto), final); assert.ok(rem2.chamadas.every((c) => c.status === 201));

  // Mesmo ponto de partida, pelos scripts especializados: functions/triggers/views e depois RLS/policies.
  const esp = await novoBanco('esp', { modelo });
  const semFuncao = await aplicar('apply-rls.js', esp);
  assert.equal(semFuncao.codigo, 1, 'policy que chama função inexistente tem de reprovar a execução');
  assert.deepEqual(resumo(semFuncao.stdout), [6, 5, 0, 1, 0]);
  assert.match(semFuncao.stdout, /FALHOU 07_policies\.sql:3: Failed to run sql query: ERROR: 42883: function public\.eh_dono\(uuid\) does not exist\n\s+DO \$idem\$ BEGIN CREATE POLICY contas_select/);
  r = await retrato(esp);
  assert.deepEqual(r.rls, ESPERADO.rls); assert.deepEqual(r.policies, ESPERADO.policies.filter((p) => !p.includes('contas_select')), 'as outras 5 instruções entraram');
  const fn = await aplicar('apply-functions.js', esp);
  assert.equal(fn.codigo, 0, fn.stdout);
  r = await retrato(esp);
  assert.deepEqual([r.funcoes, r.triggers, r.views], [ESPERADO.funcoes, ESPERADO.triggers, ESPERADO.views]);
  const rls = await aplicar('apply-rls.js', esp);
  assert.equal(rls.codigo, 0, 'reexecutar depois de corrigir a causa conclui o que faltava');
  assert.deepEqual((await retrato(esp)).policies, ESPERADO.policies);
  const tv = await aplicar('apply-triggers-views.js', esp);
  assert.equal(tv.codigo, 0); assert.deepEqual(resumo(tv.stdout), [4, 4, 0, 0, 0]); assert.deepEqual((await retrato(esp)).triggers, ESPERADO.triggers);
});

test('instrução inválida de verdade num lote: as vizinhas entram, a culpada é nomeada, saída 1 — e o resultado é estável', { skip: pular }, async () => {
  const dir = gravarDdlDeTeste(join(tmp, 'indice ruim'), { '03_indexes.sql': DDL_DE_TESTE['03_indexes.sql'].replace('CREATE UNIQUE INDEX', 'CREATE INDEX idx_ruim ON public.nao_existe USING btree (id);\nCREATE UNIQUE INDEX') });
  const banco = await novoBanco('lote');
  for (const vez of [1, 2]) {
    const r = await aplicar('chunk-apply.js', banco, { dir });
    assert.equal(r.codigo, 1, `vez ${vez}`);
    assert.deepEqual(resumo(r.stdout), [41, 40, 0, 1, 0]);
    assert.match(r.stdout, /FALHOU 03_indexes\.sql:4: Failed to run sql query: ERROR: 42P01: relation "public\.nao_existe" does not exist\n\s+CREATE INDEX IF NOT EXISTS idx_ruim ON public\.nao_existe/);
    assert.match(r.stdout, /Resultado: FALHOU \(código de saída 1\)\n$/);
    assert.deepEqual(await retrato(banco), ESPERADO, 'tudo o que é válido foi aplicado');
  }
});

test('apply-migrations.js com arquivo inválido: o arquivo não entra pela metade (atômico) e a saída é 1', { skip: pular }, async () => {
  const dir = gravarDdlDeTeste(join(tmp, 'tabela ruim'), { '02_tables.sql': `${DDL_DE_TESTE['02_tables.sql']}\nCREATE TABLE public.quebrada (id integer DEFAULT (outra + 1), outra integer);\n` });
  const banco = await novoBanco('atomico');
  const r = await aplicar('apply-migrations.js', banco, { dir });
  assert.equal(r.codigo, 1);
  assert.match(r.stdout, /FALHOU 02_tables\.sql:6 \(arquivo atômico: nada dele foi aplicado, 9 instruções\): Failed to run sql query: ERROR: 0A000: cannot use column reference in DEFAULT expression/);
  const ret = await retrato(banco);
  assert.deepEqual(ret.tabelas, [], 'nenhuma tabela do arquivo recusado ficou no banco');
  assert.deepEqual(ret.funcoes, ESPERADO.funcoes, 'o arquivo de functions, que não depende das tabelas, entrou inteiro');
  assert.deepEqual([ret.indices, ret.policies, ret.triggers, ret.views], [[], [], [], []], 'o que depende das tabelas foi recusado, arquivo a arquivo');
  assert.equal(ret.enums.length, 8);
  // Pelo caminho instrução a instrução, o mesmo DDL aplica tudo menos a tabela inválida.
  const outro = await novoBanco('atomico2');
  const all = await aplicar('apply-all.js', outro, { dir });
  assert.equal(all.codigo, 1); assert.deepEqual(resumo(all.stdout), [41, 40, 0, 1, 0]); assert.deepEqual(await retrato(outro), ESPERADO);
});

test('timeout com o servidor executando mesmo assim: o reenvio não duplica nem quebra (idempotência sob retry)', { skip: pular }, async () => {
  const banco = await novoBanco('retry');
  assert.equal((await aplicar('apply-all.js', banco)).codigo, 0);
  await sqlLocal(banco, 'DROP TRIGGER contas_toque ON public.contas');
  let primeira = true;
  const r = await aplicar('apply-triggers-views.js', banco, { env: { SUPABASE_MGMT_TIMEOUT_MS: '300' }, interceptar: (c) => { if (c.sql.includes('contas_toque') && primeira) { primeira = false; return { atrasoMs: 900 }; } return null; } });
  assert.equal(r.codigo, 0, r.stdout);
  const tentativas = r.chamadas.filter((c) => c.sql.includes('contas_toque'));
  assert.ok(tentativas.length >= 2 && tentativas.every((c) => c.status === 201), 'a instrução chegou ao banco mais de uma vez e nenhuma foi recusada');
  assert.deepEqual(await retrato(banco), ESPERADO);
});

test('429 e 500 no meio de uma aplicação real: repete e conclui com o banco completo', { skip: pular }, async () => {
  const banco = await novoBanco('http');
  let n = 0;
  const r = await aplicar('apply-all.js', banco, { interceptar: (c) => (ehDdl(c) && ++n % 7 === 0 ? { status: n % 2 ? 429 : 500, cabecalhos: { 'retry-after': '0' } } : null) });
  assert.equal(r.codigo, 0, r.stdout);
  assert.ok(r.chamadas.some((c) => c.status === 429) && r.chamadas.some((c) => c.status === 500));
  assert.match(r.stdout, /retentativas: [1-9]/); assert.deepEqual(await retrato(banco), ESPERADO);
});
