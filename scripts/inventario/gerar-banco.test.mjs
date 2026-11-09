// Testes de scripts/inventario/gerar-banco.mjs: funções puras, CLI num repositório de mentira (INVENTARIO_RAIZ) e
// o modo Management API contra 127.0.0.1 (nunca o Supabase real). Rodar: node --test scripts/inventario/gerar-banco.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import {
  PROJETO_OFICIAL, extrairInventario, contarUsoNoCodigo, conferirOrigem, versoesDoRepo,
  edgesNoRepo, edgesExternasCatalogadas, compararEdges, rodaTodoDia, montarInventario,
} from './gerar-banco.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = join(AQUI, '..', '..');
const SCRIPT = join(AQUI, 'gerar-banco.mjs');

// Mesmo formato que o banco.sql devolve (conferido contra o PG16 em banco.test.mjs).
const inventarioBase = () => ({
  format_version: 1,
  medido_em: '2026-11-09T12:00:00Z',
  resumo: { postgres: '16.15', tabelas_public: 4, ledger_registros: 3, ledger_versao_max: '20261103000000' },
  tabelas: [
    { nome: 'com_rls', rls: true, rls_forcado: true, policies: 2, triggers: 2, linhas: 7, linhas_exatas: true, bytes: 8192, particao_de: null, citada_no_banco: false },
    { nome: 'orfa', rls: true, rls_forcado: false, policies: 1, triggers: 0, linhas: 0, linhas_exatas: true, bytes: 0, particao_de: null, citada_no_banco: false },
    { nome: 'metricas', rls: true, rls_forcado: false, policies: 1, triggers: 0, linhas: 1, linhas_exatas: true, bytes: 0, particao_de: null, citada_no_banco: false },
    { nome: 'metricas_2026_11', rls: true, rls_forcado: false, policies: 0, triggers: 0, linhas: 1, linhas_exatas: true, bytes: 8192, particao_de: 'metricas', citada_no_banco: false },
  ],
  cron: {
    config: { max_worker_processes: '8' },
    jobs: [{ nome: 'limpeza', agenda: '0 3 * * *', ativo: true, chama: ['public.limpa'], execucoes_24h: 1, falhas_24h: 0, execucoes_7d: 7, falhas_7d: 0, startup_timeout_7d: 0, taxa_falha_7d_pct: 0, ultima_falha: null, duracao_max_s_7d: 2 }],
    horas_paradas_7d: [],
    historico: { linhas: 7, mais_de_7_dias: 0, mais_antigo: '2026-11-02T03:00:00Z', bytes: 8192 },
  },
  whatsapp: { conexoes: [{ nome: 'vendas', rotulo: 'Vendas', status: 'connected', ultima_conexao: null, atualizada_em: null }], mensagens_7d: 3 },
});
const com = (f) => { const d = inventarioBase(); f(d); return d; };
const tipos = (inv) => inv.alertas.map((a) => a.tipo);
function repoFalso(t, extras = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'inv banco ç-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const arquivos = {
    'supabase/migrations/20261101000000_a.sql': '-- a',
    'supabase/migrations/20261102000000_b.sql': '-- b',
    'supabase/migrations/20261103000000_c.sql': '-- c',
    'supabase/migrations/_superseded/20991231000000_x.sql': '-- fora',
    'supabase/functions/minha-fn/index.ts': "db.from('com_rls'); fetch(`${u}/rest/v1/metricas?select=*`); fetch(u + '/rest/v1/rpc/soma');",
    'supabase/functions/_shared/x.ts': "db.from('com_rls')",
    'supabase/functions/sem-index/outro.ts': '',
    'src/a.ts': "supabase.from('com_rls').select(); supabase.storage.from('orfa'); supabase\n  .from(\"com_rls\")",
    'src/a.test.ts': "supabase.from('orfa')",
    'src/__tests__/b.ts': "supabase.from('orfa')",
    'src/node_modules/x.ts': "supabase.from('orfa')",
    'scripts/inventario/edges-externas.txt': '# comentário\nexterna-a\n\n  externa-b  \n',
    ...extras,
  };
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo);
  }
  return dir;
}
function cli(args, env = {}, cwd = tmpdir()) {
  const limpo = { ...process.env };
  for (const k of ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF', 'SUPABASE_API_URL', 'INVENTARIO_RAIZ', 'INVENTARIO_PERMITIR_OUTRO_PROJETO']) delete limpo[k];
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, [SCRIPT, ...args], { cwd, env: { ...limpo, ...env } });
    let out = '', err = '';
    filho.stdout.on('data', (d) => { out += d; });
    filho.stderr.on('data', (d) => { err += d; });
    filho.on('close', (code) => resolve({ code, out, err }));
  });
}
function entrada(t, conteudo) {
  const dir = mkdtempSync(join(tmpdir(), 'inv entrada-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const arquivo = join(dir, 'entrada.json');
  writeFileSync(arquivo, typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo));
  return { arquivo, saida: join(dir, 'sub', 'banco.json'), dir };
}

test('extrairInventario: aceita psql, objeto, linhas da API, resposta e envelope do MCP', () => {
  const d = inventarioBase();
  const texto = JSON.stringify(d);
  for (const forma of [
    d, texto, `﻿  ${texto}\n\n`, [{ inventario: d }], { rows: [{ inventario: d }] }, { inventario: texto },
    { result: { content: [{ type: 'text', text: JSON.stringify({ rows: [{ inventario: d }] }) }] } },
    { content: [{ type: 'text', text: texto }] },
  ]) assert.deepEqual(extrairInventario(forma), d);
});

test('extrairInventario: entradas degeneradas dão erro claro (nunca TypeError)', () => {
  const casos = [
    ['', /entrada vazia/], ['   \n', /entrada vazia/], ['SET\n{}', /nao e JSON/], ['{"tabelas": [', /nao e JSON/],
    ['{}', /sem as chaves: format_version, medido_em, resumo, tabelas, cron, whatsapp/], ['[]', /sem as chaves/],
    ['null', /sem as chaves/], ['"texto"', /nao e JSON|sem as chaves/], ['7', /sem as chaves/], ['{"rows":[]}', /sem as chaves/],
    [com((d) => { delete d.cron; }), /sem as chaves: cron$/],
    [com((d) => { d.format_version = 2; }), /format_version 2 desconhecido/],
    [com((d) => { d.tabelas = []; }), /entrada sem tabelas/],
    [com((d) => { d.tabelas = { a: 1 }; }), /entrada sem tabelas/],
    [com((d) => { d.tabelas = [null]; }), /fora do formato.*tabelas\[\]\.nome/],
    [com((d) => { delete d.tabelas[0].nome; }), /tabelas\[\]\.nome/],
    [com((d) => { d.cron = {}; }), /cron\.jobs, cron\.horas_paradas_7d, cron\.historico/],
    [com((d) => { d.cron.jobs = [null]; }), /cron\.jobs/],
    [com((d) => { d.cron = null; }), /cron\.jobs/],
    [com((d) => { d.whatsapp = {}; }), /whatsapp\.conexoes/],
    [com((d) => { d.resumo = null; }), /resumo/],
  ];
  for (const [bruto, erro] of casos) {
    assert.throws(() => extrairInventario(bruto), (e) => !(e instanceof TypeError) && erro.test(e.message), JSON.stringify(bruto).slice(0, 80));
  }
});

test('contarUsoNoCodigo: conta src e edges, ignora testes, storage.from e rpc; nomes hostis não poluem', (t) => {
  const dir = repoFalso(t, { 'src/hostil.ts': "x.from('constructor'); x.from('__proto__'); x.from('toString')" });
  const uso = contarUsoNoCodigo(dir, ['com_rls', 'orfa', 'metricas', 'rpc', 'constructor', '__proto__']);
  assert.deepEqual({ ...uso.com_rls }, { src: 2, edges: 2 });
  assert.deepEqual({ ...uso.orfa }, { src: 0, edges: 0 });
  assert.deepEqual({ ...uso.metricas }, { src: 0, edges: 1 });
  assert.deepEqual({ ...uso.rpc }, { src: 0, edges: 0 });
  assert.deepEqual({ ...uso.constructor }, { src: 1, edges: 0 });
  assert.deepEqual({ ...uso.__proto__ }, { src: 1, edges: 0 });
  assert.equal({}.src, undefined, 'Object.prototype intacto');
  assert.equal(Object.src, undefined);
  assert.deepEqual(contarUsoNoCodigo(join(dir, 'nao-existe'), ['a']), Object.assign(Object.create(null), { a: { src: 0, edges: 0 } }));
});

test('versoesDoRepo, edgesNoRepo e edgesExternasCatalogadas leem só o que vale', (t) => {
  const dir = repoFalso(t);
  assert.deepEqual(versoesDoRepo(dir).sort(), ['20261101000000', '20261102000000', '20261103000000']);
  assert.deepEqual(edgesNoRepo(dir), ['minha-fn']);
  assert.deepEqual(edgesExternasCatalogadas(dir), ['externa-a', 'externa-b']);
  assert.deepEqual(edgesExternasCatalogadas(join(dir, 'src')), []);
});

test('conferirOrigem: ledger recente passa; ledger velho, ausente ou manifesto diferente falham', () => {
  const versoes = ['20261101000000', '20261102000000', '20261103000000'];
  const d = inventarioBase();
  assert.deepEqual(conferirOrigem(d, null, versoes), { manifesto: 'ausente', ledger_registros: 3, migrations_no_repo: 3 });
  assert.throws(() => conferirOrigem(com((x) => { x.resumo.ledger_versao_max = '20250101000000'; }), null, versoes), /nao parece ser do banco oficial/);
  assert.throws(() => conferirOrigem(com((x) => { delete x.resumo.ledger_versao_max; }), null, versoes), /ledger_versao_max/);
  assert.throws(() => conferirOrigem(com((x) => { x.resumo.ledger_registros = '3'; }), null, versoes), /ledger_registros/);
  assert.throws(() => conferirOrigem(d, null, []), /nao ha como conferir/);
  assert.throws(() => conferirOrigem(d, null, null), /nao ha como conferir/);
  const nomes = d.tabelas.map((x) => x.nome);
  assert.equal(conferirOrigem(d, nomes, versoes).tabelas_em_comum_com_manifesto, 4);
  assert.throws(() => conferirOrigem(d, ['outra', 'mais_uma'], versoes), /0 tabelas em comum/);
  assert.throws(() => conferirOrigem(d, [], versoes), /nao parece ser do banco oficial/);
});

test('rodaTodoDia', () => {
  for (const a of ['* * * * *', '*/5 * * * *', '0 3 * * *', '0 3 */1 * 0-6', '0 3 1-31 1-12 1-7', '30 seconds', '1 second', '  0 3 * * *  ']) assert.equal(rodaTodoDia(a), true, a);
  for (const a of ['0 3 * * 1', '0 3 1 * *', '0 3 * 6 *', '0 3 */2 * *', '', null, undefined, '* * * *', '@daily', 'seconds']) assert.equal(rodaTodoDia(a), false, String(a));
});

test('compararEdges: sem consulta, com consulta e com catálogo de externas', () => {
  assert.deepEqual(compararEdges(null, ['a'], ['x']), {
    publicadas: null, no_repo: 1, publicadas_sem_codigo_no_repo: null, no_repo_sem_deploy: null,
    externas: { catalogadas: 1, no_ar: null, sem_jwt: null, catalogadas_sem_deploy: null },
  });
  const api = [
    { slug: 'b', version: 3, status: 'ACTIVE', verify_jwt: true, updated_at: 1762689600000 },
    { slug: 'a', version: 1, status: 'ACTIVE', verify_jwt: false },
    { slug: 'externa-a', version: 9, status: 'ACTIVE', verify_jwt: false, updated_at: '2026-11-01T10:20:30Z' },
    { slug: 'desconhecida', version: 1, status: 'ACTIVE', verify_jwt: true },
  ];
  const r = compararEdges(api, ['a', 'so-no-repo'], ['externa-a', 'externa-b']);
  assert.deepEqual(r.publicadas.map((f) => f.slug), ['a', 'b', 'desconhecida', 'externa-a']);
  assert.equal(r.publicadas[1].atualizada_em, '2025-11-09T12:00Z');
  assert.equal(r.publicadas[0].atualizada_em, null);
  assert.deepEqual(r.publicadas_sem_codigo_no_repo, ['b', 'desconhecida']);
  assert.deepEqual(r.no_repo_sem_deploy, ['so-no-repo']);
  assert.deepEqual(r.externas, { catalogadas: 2, no_ar: ['externa-a'], sem_jwt: ['externa-a'], catalogadas_sem_deploy: ['externa-b'] });
  assert.deepEqual(compararEdges([], [], []).publicadas, []);
});

test('montarInventario: sem alerta no estado saudável; partição com RLS e policy no pai não alerta', () => {
  const uso = { com_rls: { src: 1, edges: 0 }, metricas: { src: 0, edges: 1 }, metricas_2026_11: { src: 0, edges: 0 } };
  const inv = montarInventario(inventarioBase(), uso);
  assert.deepEqual(inv.alertas, []);
  assert.deepEqual(inv.tabelas_orfas.lista, ['orfa']);
  assert.deepEqual(inv.tabelas[0].uso_no_codigo, { edges: 0, src: 1 });
  assert.deepEqual(inv.tabelas.find((x) => x.nome === 'orfa').uso_no_codigo, { edges: 0, src: 0 });
  assert.deepEqual(Object.keys(inv), Object.keys(inv).slice().sort(), 'chaves ordenadas');
  assert.equal(inv.edge_functions.publicadas, null);
});

test('montarInventario: cada condição ruim vira o alerta certo', () => {
  const alerta = (f, edges) => montarInventario(com(f), {}, edges);
  assert.deepEqual(alerta((d) => { d.tabelas[0].rls = false; }).alertas, [{ detalhe: ['com_rls'], tipo: 'tabela_sem_rls' }]);
  assert.deepEqual(alerta((d) => { d.tabelas[1].policies = 0; }).alertas, [{ detalhe: ['orfa'], tipo: 'rls_sem_policy' }]);
  assert.deepEqual(tipos(alerta((d) => { d.tabelas[2].policies = 0; })), ['rls_sem_policy'], 'pai sem policy: pai e partição alertam');
  assert.deepEqual(alerta((d) => { d.tabelas[2].policies = 0; }).alertas[0].detalhe, ['metricas', 'metricas_2026_11']);
  assert.deepEqual(alerta((d) => { d.cron.jobs[0].taxa_falha_7d_pct = 5; }).alertas, [{ detalhe: ['limpeza (5% em 7d)'], tipo: 'cron_falhando' }]);
  assert.deepEqual(tipos(alerta((d) => { d.cron.jobs[0].taxa_falha_7d_pct = 4.9; })), []);
  assert.deepEqual(tipos(alerta((d) => { d.cron.jobs[0].taxa_falha_7d_pct = 50; d.cron.jobs[0].ativo = false; })), []);
  assert.deepEqual(alerta((d) => { d.cron.jobs[0].execucoes_24h = 0; }).alertas, [{ detalhe: ['limpeza'], tipo: 'cron_sem_execucao' }]);
  assert.deepEqual(tipos(alerta((d) => { d.cron.jobs[0].execucoes_24h = 0; d.cron.jobs[0].agenda = '0 3 * * 1'; })), []);
  assert.deepEqual(alerta((d) => { d.cron.horas_paradas_7d = [{ hora: '2026-11-08T07:00Z', execucoes: 2, falhas: 2 }]; }).alertas, [{ detalhe: ['2026-11-08T07:00Z'], tipo: 'cron_parado' }]);
  assert.deepEqual(tipos(alerta((d) => { d.cron.historico.mais_de_7_dias = 50001; })), ['historico_cron_sem_limpeza']);
  assert.deepEqual(tipos(alerta((d) => { d.cron.historico.mais_de_7_dias = 50000; })), []);
  assert.deepEqual(alerta((d) => { d.whatsapp.conexoes.push({ nome: 'x', status: null }, { nome: 'y', status: 'close' }); }).alertas, [{ detalhe: ['x: sem status', 'y: close'], tipo: 'whatsapp_desconectado' }]);
  const edges = compararEdges([{ slug: 'nova' }], ['fn-sem-deploy'], []);
  assert.deepEqual(tipos(alerta(() => {}, edges)), ['edge_sem_deploy', 'edge_publicada_sem_codigo']);
});

test('montarInventario: nomes com caracteres de Markdown/JSON passam intactos', () => {
  const nomes = ['pipe|star*_`md`', 'a.b', 'foo(bar', 'x[y', 'Maiúscula Ç', 'a\\b', '"aspas"', '<tag>', '# titulo', 'linha\nnova', '__proto__', 'constructor'];
  const d = com((x) => { x.tabelas = nomes.map((nome) => ({ nome, rls: false, policies: 0, linhas: 0, citada_no_banco: false, particao_de: null })); });
  const inv = montarInventario(extrairInventario(JSON.stringify(d)), contarUsoNoCodigo(join(tmpdir(), 'nao-existe-g2'), nomes));
  const volta = JSON.parse(JSON.stringify(inv, null, 2));
  assert.deepEqual(volta.tabelas.map((x) => x.nome), nomes);
  assert.deepEqual(volta.tabelas_orfas.lista, nomes);
  assert.deepEqual(volta.alertas[0], { detalhe: nomes, tipo: 'tabela_sem_rls' });
  for (const x of volta.tabelas) assert.deepEqual(x.uso_no_codigo, { edges: 0, src: 0 });
});

// ─── CLI ─────────────────────────────────────────────────────────────────────
test('CLI --entrada: grava em --saida (cria a pasta), duas execuções dão os mesmos bytes', async (t) => {
  const raiz = repoFalso(t);
  const { arquivo, saida } = entrada(t, `${JSON.stringify(inventarioBase())}\n`);
  const r = await cli(['--entrada', arquivo, '--saida', saida], { INVENTARIO_RAIZ: raiz });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /^banco\.json: 4 tabelas, 1 cron jobs, 1 orfas, 0 alertas, edges 1 no repo \(publicadas nao consultadas\) \(medido_em 2026-11-09T12:00:00Z\)\.\n$/);
  const texto = readFileSync(saida, 'utf8');
  const inv = JSON.parse(texto);
  assert.deepEqual(inv.tabelas.find((x) => x.nome === 'com_rls').uso_no_codigo, { edges: 2, src: 2 });
  assert.deepEqual(inv.alertas, []);
  assert.deepEqual(inv.tabelas_orfas.lista, ['orfa']);
  assert.equal(inv.edge_functions.no_repo, 1);
  assert.ok(texto.endsWith('}\n'));
  assert.deepEqual(readdirSync(dirname(saida)), ['banco.json'], 'sem temporário esquecido');
  await cli(['--entrada', arquivo, '--saida', saida], { INVENTARIO_RAIZ: raiz });
  assert.equal(readFileSync(saida, 'utf8'), texto);
  assert.equal(existsSync(join(raiz, 'inventario')), false, 'com --saida nada vai para a raiz');
});

test('CLI --entrada sem --saida grava em <raiz>/inventario/estado/banco.json; --dry-run não grava', async (t) => {
  const raiz = repoFalso(t);
  const { arquivo } = entrada(t, inventarioBase());
  const seco = await cli(['--entrada', arquivo, '--dry-run'], { INVENTARIO_RAIZ: raiz });
  assert.equal(seco.code, 0, seco.err);
  assert.match(seco.out, /^\(--dry-run, nada gravado\) banco\.json: 4 tabelas/);
  assert.equal(existsSync(join(raiz, 'inventario')), false);
  const r = await cli(['--entrada', arquivo], { INVENTARIO_RAIZ: raiz });
  assert.equal(r.code, 0, r.err);
  assert.equal(JSON.parse(readFileSync(join(raiz, 'inventario/estado/banco.json'), 'utf8')).tabelas.length, 4);
});

test('CLI --functions: cruza as publicadas com o repo e o catálogo de externas', async (t) => {
  const raiz = repoFalso(t);
  const { arquivo, saida, dir } = entrada(t, inventarioBase());
  writeFileSync(join(dir, 'fn.json'), JSON.stringify([{ slug: 'minha-fn', version: 2, status: 'ACTIVE', verify_jwt: true }, { slug: 'externa-a', verify_jwt: false }, { slug: 'intrusa' }]));
  const r = await cli(['--entrada', arquivo, '--functions', join(dir, 'fn.json'), '--saida', saida], { INVENTARIO_RAIZ: raiz });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /edges 3 publicadas\/1 no repo\/1 externas catalogadas/);
  const inv = JSON.parse(readFileSync(saida, 'utf8'));
  assert.deepEqual(inv.alertas, [{ detalhe: ['intrusa'], tipo: 'edge_publicada_sem_codigo' }]);
  assert.deepEqual(inv.edge_functions.externas.sem_jwt, ['externa-a']);
  for (const ruim of ['{"message":"erro"}', '[{"nome":"sem slug"}]', 'não é json']) {
    writeFileSync(join(dir, 'fn.json'), ruim);
    const e = await cli(['--entrada', arquivo, '--functions', join(dir, 'fn.json'), '--saida', join(dir, 'x.json')], { INVENTARIO_RAIZ: raiz });
    assert.equal(e.code, 2, ruim);
    assert.match(e.err, /^ERRO: (a lista de edge functions|--functions: o arquivo nao e JSON)/);
    assert.equal(existsSync(join(dir, 'x.json')), false);
  }
});

test('CLI: saída com cara de credencial é recusada e nada é gravado', async (t) => {
  const raiz = repoFalso(t);
  const segredo = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.assinatura';
  for (const texto of [segredo, 'Bearer abcdefghijklmnopqrstuvwxyz0123', 'sb_secret_abc']) {
    const { arquivo, saida } = entrada(t, com((d) => { d.whatsapp.conexoes[0].rotulo = texto; }));
    const r = await cli(['--entrada', arquivo, '--saida', saida], { INVENTARIO_RAIZ: raiz });
    assert.equal(r.code, 2);
    assert.match(r.err, /cara de credencial; nada foi gravado/);
    assert.equal(existsSync(saida), false);
    assert.doesNotMatch(r.out + r.err, /assinatura|abcdefghij|sb_secret_abc/);
  }
});

test('CLI: erros de uso e de entrada saem com 2 e "ERRO:" (sem stack)', async (t) => {
  const raiz = repoFalso(t);
  const { arquivo, saida, dir } = entrada(t, inventarioBase());
  const env = { INVENTARIO_RAIZ: raiz };
  const casos = [
    [[], /sem --entrada e sem SUPABASE_ACCESS_TOKEN/],
    [['--entrada'], /--entrada exige o caminho/],
    [['--entrada', '--saida', saida], /--entrada exige o caminho/],
    [['--entrada', arquivo, '--functions'], /--functions exige o caminho/],
    [['--entrada', arquivo, '--saida'], /--saida exige o caminho/],
    [['--entrada', join(dir, 'nao-existe.json')], /nao consegui ler o arquivo de --entrada .*ENOENT/],
    [['--entrada', dir], /nao consegui ler o arquivo de --entrada .*EISDIR/],
  ];
  for (const [args, erro] of casos) {
    const r = await cli(args, env);
    assert.equal(r.code, 2, args.join(' '));
    assert.match(r.err, erro);
    assert.match(r.err, /^ERRO: /);
    assert.doesNotMatch(r.err, /\n\s+at /);
  }
  for (const [conteudo, erro] of [['', /entrada vazia/], ['SET\n{}', /nao e JSON/], ['{}', /sem as chaves/], [com((d) => { d.cron = {}; }), /fora do formato/], [com((d) => { d.resumo.ledger_versao_max = '20200101000000'; }), /nao parece ser do banco oficial/]]) {
    const e = entrada(t, conteudo);
    const r = await cli(['--entrada', e.arquivo, '--saida', e.saida], env);
    assert.equal(r.code, 2);
    assert.match(r.err, erro);
    assert.equal(existsSync(e.saida), false);
  }
  const semMigrations = mkdtempSync(join(tmpdir(), 'inv-vazio-'));
  t.after(() => rmSync(semMigrations, { recursive: true, force: true }));
  const r = await cli(['--entrada', arquivo, '--saida', saida], { INVENTARIO_RAIZ: semMigrations });
  assert.equal(r.code, 2);
  assert.match(r.err, /^ERRO: /);
  assert.equal((await cli(['--help'])).code, 0);
});

test('CLI no repositório real: --dry-run lê o repo de verdade e não grava nada', async (t) => {
  const alvo = join(REPO, 'inventario/estado/banco.json');
  const antes = existsSync(alvo) ? statSync(alvo).mtimeMs : null;
  const d = com((x) => { x.resumo.ledger_versao_max = '99991231235959'; x.tabelas[0].nome = 'contacts'; });
  const { arquivo } = entrada(t, d);
  const r = await cli(['--entrada', arquivo, '--dry-run']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /\(--dry-run, nada gravado\) banco\.json: 4 tabelas, 1 cron jobs, 1 orfas, 0 alertas, edges \d{2,} no repo/);
  assert.equal(existsSync(alvo) ? statSync(alvo).mtimeMs : null, antes);
});

// ─── Modo Management API (servidor local) ────────────────────────────────────
async function api(t, { consulta = () => [200, [{ inventario: inventarioBase() }]], funcoes = () => [200, [{ slug: 'minha-fn', version: 1, status: 'ACTIVE', verify_jwt: true }]] } = {}) {
  const pedidos = [];
  const server = createServer((req, res) => {
    let corpo = '';
    req.on('data', (c) => { corpo += c; });
    req.on('end', () => {
      pedidos.push({ method: req.method, url: req.url, auth: req.headers.authorization, corpo });
      const [status, resposta] = req.url.endsWith('/functions') ? funcoes() : consulta();
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(typeof resposta === 'string' ? resposta : JSON.stringify(resposta));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return { url: `http://127.0.0.1:${server.address().port}`, pedidos };
}
const TOKEN = 'sbp_token_de_mentira_do_teste_0123456789';
test('API: manda o banco.sql para /database/query/read-only do projeto oficial e lê /functions', async (t) => {
  const raiz = repoFalso(t);
  const m = await api(t);
  const { saida } = entrada(t, '');
  const r = await cli(['--saida', saida], { INVENTARIO_RAIZ: raiz, SUPABASE_ACCESS_TOKEN: ` ${TOKEN}\n`, SUPABASE_API_URL: `${m.url}/` });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /edges 1 publicadas\/1 no repo\/0 externas catalogadas/);
  assert.deepEqual(m.pedidos.map((p) => `${p.method} ${p.url}`), [
    `POST /v1/projects/${PROJETO_OFICIAL}/database/query/read-only`, `GET /v1/projects/${PROJETO_OFICIAL}/functions`,
  ]);
  for (const p of m.pedidos) assert.equal(p.auth, `Bearer ${TOKEN}`);
  assert.equal(JSON.parse(m.pedidos[0].corpo).query, readFileSync(join(AQUI, 'banco.sql'), 'utf8'), 'o SQL enviado é o banco.sql ao lado do script');
  assert.deepEqual(JSON.parse(readFileSync(saida, 'utf8')).alertas, []);
  assert.doesNotMatch(r.out + r.err + readFileSync(saida, 'utf8'), new RegExp(TOKEN));
});

test('API: erro HTTP, corpo que não é JSON, resposta vazia e porta fechada falham sem gravar e sem vazar corpo nem token', async (t) => {
  const raiz = repoFalso(t);
  const casos = [
    [{ consulta: () => [500, { message: `falhou com Bearer ${TOKEN}` }] }, /Management API \/database\/query\/read-only respondeu HTTP 500/],
    [{ consulta: () => [401, 'nao autorizado'] }, /HTTP 401/],
    [{ consulta: () => [200, '<html>'] }, /nao devolveu JSON/],
    [{ consulta: () => [200, []] }, /sem as chaves/],
    [{ funcoes: () => [503, {}] }, /Management API \/functions respondeu HTTP 503/],
    [{ funcoes: () => [200, { message: 'x' }] }, /a lista de edge functions publicadas/],
  ];
  casos.push([null, /^ERRO: /]); // porta sem ninguém ouvindo
  for (const [mock, erro] of casos) {
    const url = mock ? (await api(t, mock)).url : 'http://127.0.0.1:1';
    const { saida } = entrada(t, '');
    const r = await cli(['--saida', saida], { INVENTARIO_RAIZ: raiz, SUPABASE_ACCESS_TOKEN: TOKEN, SUPABASE_API_URL: url });
    assert.equal(r.code, 2);
    assert.match(r.err, erro);
    assert.doesNotMatch(r.out + r.err, new RegExp(`${TOKEN}|falhou com`));
    assert.equal(existsSync(saida), false);
  }
});

test('API: outro projeto e SUPABASE_API_URL fora do loopback são recusados antes de qualquer rede', async (t) => {
  const raiz = repoFalso(t);
  const m = await api(t);
  const base = { INVENTARIO_RAIZ: raiz, SUPABASE_ACCESS_TOKEN: TOKEN, SUPABASE_API_URL: m.url };
  const outro = await cli(['--dry-run'], { ...base, SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst' });
  assert.equal(outro.code, 2);
  assert.match(outro.err, /nao e o banco oficial/);
  const fora = await cli(['--dry-run'], { ...base, SUPABASE_API_URL: 'https://exemplo.invalid' });
  assert.equal(fora.code, 2);
  assert.match(fora.err, /SUPABASE_API_URL so aceita 127\.0\.0\.1/);
  assert.equal(m.pedidos.length, 0);
  const liberado = await cli(['--dry-run'], { ...base, SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst', INVENTARIO_PERMITIR_OUTRO_PROJETO: '1' });
  assert.equal(liberado.code, 0, liberado.err);
  assert.equal(m.pedidos[0].url, '/v1/projects/abcdefghijklmnopqrst/database/query/read-only');
});
