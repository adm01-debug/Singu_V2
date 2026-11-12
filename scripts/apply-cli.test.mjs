// Contrato de CLI dos 10 aplicadores de DDL (apply-*.js, chunk-apply.js, fix-enums.js, retry-failed.js).
// Não precisa de banco: a "Management API" é um servidor local em 127.0.0.1 que responde 201 a tudo.
// Rodar: node --test scripts/apply-cli.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gravarDdlDeTeste, iniciarMock, rodarCli } from './lib/mgmt-mock.test.mjs';
import { dividirSql } from './lib/sql-split.mjs';
import { REF_CANONICO, SQL_CONTAR_TABELAS } from './lib/supabase-mgmt.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = ['apply-all.js', 'apply-functions.js', 'apply-migrations.js', 'apply-missing.js', 'apply-remaining.js',
  'apply-rls.js', 'apply-triggers-views.js', 'chunk-apply.js', 'fix-enums.js', 'retry-failed.js'];
// Requisições esperadas com o DDL de teste (1 POST = 1 unidade do plano), conferidas contra a simulação.
const TAMANHO_DO_LOTE = { 'apply-functions.js': 3, 'apply-remaining.js': 8, 'chunk-apply.js': 40 };

let tmp; let ddl; let mock;
before(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'g1-cli-'));
  ddl = gravarDdlDeTeste(join(tmp, 'ddl de teste (ação)'));
  mock = await iniciarMock();
});
after(async () => { await mock.fechar(); rmSync(tmp, { recursive: true, force: true }); });
const zerar = () => { mock.chamadas.length = 0; };
const totalDaSimulacao = (stdout) => { const m = /TOTAL: (\d+) instrução\(ões\) em (\d+) requisição\(ões\)/.exec(stdout); return m && { instrucoes: Number(m[1]), requisicoes: Number(m[2]) }; };

for (const script of SCRIPTS) {
  test(`${script}: importar não executa nada e expõe main/definicao`, async () => {
    zerar();
    const mod = await import(`./${script}`);
    assert.equal(typeof mod.main, 'function'); assert.equal(mod.definicao.nome, script); assert.equal(typeof mod.definicao.montarEtapas, 'function');
    assert.equal(mock.chamadas.length, 0);
  });

  test(`${script}: cabeçalho documenta que o padrão é simulação e que aplicar exige --apply`, () => {
    const cabecalho = readFileSync(join(AQUI, script), 'utf8').split('\n').filter((l) => l.startsWith('//')).join('\n');
    assert.match(cabecalho, /PRODUÇÃO/); assert.match(cabecalho, /padrão é SIMULAÇÃO/); assert.match(cabecalho, /exige --apply/);
    assert.match(cabecalho, new RegExp(`node scripts/${script.replace('.', '\\.')} --apply`)); assert.match(cabecalho, /Saída: 0 ok · 1 /);
    assert.doesNotMatch(readFileSync(join(AQUI, script), 'utf8'), /sbp_[A-Za-z0-9]{8,}|api\.supabase\.com/, 'sem token nem host fixo no script');
  });

  test(`${script}: --help sai 0, explica as flags e não chama a API (mesmo sem token)`, async () => {
    zerar();
    const r = await rodarCli(script, ['--help'], { env: { SUPABASE_MGMT_API_URL: mock.url }, cwd: tmp });
    assert.equal(r.codigo, 0); assert.equal(r.stderr, '');
    for (const trecho of [script, '--apply', '--dry-run', '--sql', '--ddl-dir', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF']) assert.ok(r.stdout.includes(trecho), trecho);
    assert.equal(mock.chamadas.length, 0);
  });

  test(`${script}: sem flags (e com --dry-run) só simula — nenhuma requisição, mesmo com token no ambiente`, async () => {
    zerar();
    const semToken = await rodarCli(script, ['--ddl-dir', ddl], { env: { SUPABASE_MGMT_API_URL: mock.url }, cwd: tmp });
    const comToken = await rodarCli(script, ['--dry-run', '--ddl-dir', ddl], { mock, cwd: tmp });
    for (const r of [semToken, comToken]) {
      assert.equal(r.codigo, 0, r.stderr); assert.equal(r.stderr, '');
      assert.match(r.stdout, new RegExp(`^${script.replace('.', '\\.')}: SIMULAÇÃO \\(nada é enviado\\)\\. Projeto ${REF_CANONICO} em `));
      assert.ok(totalDaSimulacao(r.stdout).instrucoes > 0); assert.ok(!r.stdout.includes(mock.token));
    }
    assert.match(semToken.stdout, /Token ausente \(necessário para --apply\)/); assert.match(comToken.stdout, /Token presente/);
    assert.equal(mock.chamadas.length, 0, 'simulação não pode tocar a API');
  });

  test(`${script}: --sql emite um script SQL válido com exatamente o que a simulação anuncia`, async () => {
    const resumo = totalDaSimulacao((await rodarCli(script, ['--ddl-dir', ddl], { cwd: tmp })).stdout);
    const r = await rodarCli(script, ['--sql', '--ddl-dir', ddl], { cwd: tmp });
    assert.equal(r.codigo, 0);
    assert.equal(dividirSql(r.stdout).length, resumo.instrucoes);
    for (const linha of r.stdout.split('\n').filter((l) => /SIMULAÇÃO|TOTAL|^\[/.test(l))) assert.match(linha, /^-- /, 'linhas de log viram comentário SQL');
  });

  test(`${script}: --apply sem token sai 2 antes de qualquer requisição`, async () => {
    zerar();
    const r = await rodarCli(script, ['--apply', '--ddl-dir', ddl], { env: { SUPABASE_MGMT_API_URL: mock.url }, cwd: tmp });
    assert.equal(r.codigo, 2); assert.equal(r.stdout, '');
    assert.match(r.stderr, /SUPABASE_ACCESS_TOKEN é obrigatório com --apply/); assert.match(r.stderr, /Nada foi enviado/);
    assert.equal(mock.chamadas.length, 0);
  });

  test(`${script}: flag desconhecida ou --apply junto de --dry-run sai 2 sem requisição`, async () => {
    zerar();
    for (const args of [['--aplica'], ['--apply', '--dry-run'], ['--apply', '--sql'], ['--ddl-dir']]) {
      const r = await rodarCli(script, args, { env: { SUPABASE_MGMT_API_URL: mock.url, SUPABASE_ACCESS_TOKEN: mock.token }, cwd: tmp });
      assert.equal(r.codigo, 2, args.join(' ')); assert.match(r.stderr, new RegExp(`^${script.replace('.', '\\.')}: `));
    }
    assert.equal(mock.chamadas.length, 0);
  });

  test(`${script}: --apply envia o que a simulação anunciou, ao projeto e com o token certos, e nunca imprime o token`, async () => {
    const resumo = totalDaSimulacao((await rodarCli(script, ['--ddl-dir', ddl], { cwd: tmp })).stdout);
    zerar();
    const r = await rodarCli(script, ['--apply', '--ddl-dir', ddl], { mock, cwd: tmp });
    assert.equal(r.codigo, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /APLICAÇÃO REAL no projeto/); assert.match(r.stdout, /Resultado: SUCESSO \(código de saída 0\)\n$/);
    assert.ok(!(r.stdout + r.stderr).includes(mock.token), 'token vazou na saída');
    assert.ok(mock.chamadas.every((c) => c.ref === REF_CANONICO && c.autorizacao === `Bearer ${mock.token}` && c.status === 201));
    const ddlEnviado = mock.chamadas.filter((c) => c.sql !== SQL_CONTAR_TABELAS && !c.sql.startsWith('SELECT table_schema'));
    assert.equal(ddlEnviado.length, resumo.requisicoes, 'nº de POSTs de DDL = nº anunciado na simulação');
    assert.equal(ddlEnviado.reduce((n, c) => n + dividirSql(c.sql).length, 0), resumo.instrucoes, 'nº de instruções enviadas = anunciado');
    assert.equal(mock.chamadas.filter((c) => c.sql === SQL_CONTAR_TABELAS).length, 2, 'conta tabelas antes e depois');
    const lote = TAMANHO_DO_LOTE[script];
    if (lote) assert.ok(ddlEnviado.some((c) => dividirSql(c.sql).length > 1) && ddlEnviado.every((c) => dividirSql(c.sql).length <= lote), `lotes de até ${lote}`);
    else if (script !== 'apply-migrations.js') assert.ok(ddlEnviado.every((c) => dividirSql(c.sql).length === 1), 'uma instrução por POST');
    assert.match(r.stdout, new RegExp(`RESUMO ${script.replace('.', '\\.')}: ${resumo.instrucoes} instrução\\(ões\\) — ${resumo.instrucoes} ok, 0 já existiam, 0 falharam, 0 não executadas`));
  });
}

test('apply-migrations.js: um POST por arquivo, na ordem de 99_apply_all.sql', async () => {
  zerar();
  await rodarCli('apply-migrations.js', ['--apply', '--ddl-dir', ddl], { mock, cwd: tmp });
  const primeiras = mock.chamadas.filter((c) => c.sql !== SQL_CONTAR_TABELAS).map((c) => c.sql.split('\n')[0].slice(0, 80));
  assert.equal(primeiras.length, 12);
  assert.match(primeiras[0], /^CREATE EXTENSION/); assert.match(primeiras[2], /^CREATE TABLE IF NOT EXISTS public\.contas/);
  assert.match(primeiras[3], /^CREATE TABLE IF NOT EXISTS public\.audit_log_2026_11 PARTITION/); assert.match(primeiras[4], /^CREATE OR REPLACE VIEW/);
  assert.match(primeiras[5], /^CREATE OR REPLACE FUNCTION/); assert.match(primeiras[9], /^ALTER TABLE public\.contas ENABLE ROW/);
});

test('functions vão antes de RLS/policies em todos os scripts que aplicam os dois', async () => {
  for (const script of ['apply-all.js', 'chunk-apply.js', 'apply-remaining.js', 'apply-migrations.js']) {
    const { stdout } = await rodarCli(script, ['--ddl-dir', ddl], { cwd: tmp });
    assert.ok(stdout.indexOf('[08_functions.sql]') > 0 && stdout.indexOf('[08_functions.sql]') < stdout.indexOf('[07_policies.sql]'), script);
  }
});

test('funciona de qualquer diretório, em caminho com espaço/acento, por symlink e com --ddl-dir relativo', async () => {
  const copia = join(tmp, 'cópia do repo (ação)', 'scripts');
  mkdirSync(copia, { recursive: true });
  for (const f of SCRIPTS) cpSync(join(AQUI, f), join(copia, f));
  cpSync(join(AQUI, 'lib'), join(copia, 'lib'), { recursive: true });
  gravarDdlDeTeste(join(copia, 'migration', 'ddl'));
  const direto = await rodarCli(join(copia, 'apply-rls.js'), [], { cwd: '/' });
  assert.equal(direto.codigo, 0, direto.stderr); assert.match(direto.stdout, /TOTAL: 6 instrução\(ões\)/, 'usa o DDL ao lado do script, não o do cwd');
  symlinkSync(join(copia, 'apply-rls.js'), join(tmp, 'atalho.js'));
  const porAtalho = await rodarCli(join(tmp, 'atalho.js'), [], { cwd: tmp });
  assert.equal(porAtalho.codigo, 0, porAtalho.stderr); assert.match(porAtalho.stdout, /TOTAL: 6 instrução\(ões\)/, 'invocado por symlink ainda roda como CLI');
  const relativo = await rodarCli('apply-rls.js', ['--ddl-dir', 'ddl de teste (ação)'], { cwd: tmp });
  assert.equal(relativo.codigo, 0, relativo.stderr); assert.match(relativo.stdout, /TOTAL: 6 instrução\(ões\)/);
});

test('sem --ddl-dir os scripts leem scripts/migration/ddl da raiz do repo, seja qual for o cwd', async () => {
  const r = await rodarCli('apply-rls.js', [], { cwd: tmp });
  assert.equal(r.codigo, 0, r.stderr);
  const linhas = (f) => readFileSync(join(AQUI, 'migration', 'ddl', f), 'utf8').split('\n');
  const esperado = linhas('06_rls_enable.sql').filter((l) => l.startsWith('ALTER TABLE ')).length + linhas('07_policies.sql').filter((l) => l.startsWith('CREATE POLICY ')).length;
  assert.equal(totalDaSimulacao(r.stdout).instrucoes, esperado);
  assert.match(r.stdout, /06_rls_enable\.sql:3 {2}ALTER TABLE public\.abm_account_plans ENABLE ROW LEVEL SECURITY/, 'a 1ª instrução do arquivo não é mais descartada');
});

test('fix-enums.js: os enums embutidos são os mesmos de 01_schemas_and_enums.sql', async () => {
  const { ENUMS } = await import('./fix-enums.js');
  const noArquivo = Object.fromEntries(dividirSql(readFileSync(join(AQUI, 'migration', 'ddl', '01_schemas_and_enums.sql'), 'utf8'))
    .map((s) => /^CREATE TYPE (\S+) AS ENUM \((.*)\)$/s.exec(s.sql)).filter(Boolean).map((m) => [m[1], m[2].split(',').map((v) => v.trim().replace(/^'|'$/g, ''))]));
  for (const [nome, valores] of Object.entries(ENUMS)) assert.deepEqual(valores, noArquivo[nome], nome);
});

test('retry-failed.js e apply-missing.js acham as tabelas certas no 02_tables.sql real', async () => {
  const { instrucoesDasTabelas, TABELAS } = await import('./retry-failed.js');
  const achadas = instrucoesDasTabelas(join(AQUI, 'migration', 'ddl'));
  assert.deepEqual(achadas.map((i) => /^CREATE TABLE IF NOT EXISTS public\.(\w+) \(/.exec(i.sql)?.[1]), TABELAS);
  for (const i of achadas) assert.match(i.sql, /\)$/);
  const { tabelasDoArquivo, faltantes } = await import('./apply-missing.js');
  const todas = tabelasDoArquivo(join(AQUI, 'migration', 'ddl'));
  const criadas = (f) => readFileSync(join(AQUI, 'migration', 'ddl', f), 'utf8').split('\n').filter((l) => l.startsWith('CREATE TABLE ')).length;
  assert.equal(todas.length, criadas('02_tables.sql') + criadas('11_partitions.sql'));
  assert.equal(new Set(todas.map((t) => t.chave)).size, todas.length, 'sem tabela repetida');
  const existentes = todas.slice(0, 10).map((t) => ({ table_schema: t.chave.split('.')[0], table_name: t.chave.split('.')[1] }));
  assert.equal(faltantes(todas, existentes).length, todas.length - 10);
});
