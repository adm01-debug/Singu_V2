// Testes unitários do núcleo dos aplicadores de DDL (scripts/lib/supabase-mgmt.mjs): configuração,
// argumentos, cliente HTTP (com fetch falso — nenhuma rede) e execução do plano.
// Rodar: node --test scripts/lib/supabase-mgmt.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classificarErro, criarCliente, DIR_DDL_PADRAO, ehCli, emOrdemCanonica, emUnidades, ErroDeUso, executarPlano,
  lerArgs, lerConfig, ORDEM_DDL, principal, RAIZ_REPO, REF_CANONICO, SQL_CONTAR_TABELAS,
} from './supabase-mgmt.mjs';
import { dividirSql } from './sql-split.mjs';

const TOKEN = 'sbp_segredo_de_teste_0123456789';
const cfgDe = (extra = {}) => lerConfig({ SUPABASE_ACCESS_TOKEN: TOKEN, SUPABASE_MGMT_API_URL: 'http://127.0.0.1:9', SUPABASE_MGMT_PAUSA_MS: '0', ...extra });
const resposta = (status, corpo, cabecalhos = {}) => new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status, headers: cabecalhos });
/** fetch falso: devolve as respostas da fila em ordem (função = chamada com (url, init)). */
function fetchFalso(fila) {
  const chamadas = [];
  const f = async (url, init) => {
    chamadas.push({ url, init });
    const item = fila.length > 1 ? fila.shift() : fila[0];
    return typeof item === 'function' ? item(url, init) : item.clone();
  };
  return Object.assign(f, { chamadas });
}
const semEspera = () => { const esperas = []; return Object.assign(async (ms) => { esperas.push(ms); }, { esperas }); };

// ── configuração ────────────────────────────────────────────────────────────────────────────────────
test('config: padrões seguros e ref canônico igual ao do AGENTS.md', () => {
  const c = lerConfig({});
  assert.deepEqual(c, { token: '', ref: REF_CANONICO, urlBase: 'https://api.supabase.com', timeoutMs: 55000, retentativas: 4, backoffMs: 500, pausaMs: 100 });
  const canonico = /Supabase canônico: `([a-z0-9]{20})`/.exec(readFileSync(join(RAIZ_REPO, 'AGENTS.md'), 'utf8'))?.[1];
  assert.equal(REF_CANONICO, canonico);
  assert.equal(DIR_DDL_PADRAO, join(RAIZ_REPO, 'scripts', 'migration', 'ddl'));
});

test('config: ref, URL e números vêm do ambiente e são validados', () => {
  const c = lerConfig({ SUPABASE_PROJECT_REF: 'abcdefghij0123456789', SUPABASE_MGMT_API_URL: 'http://localhost:8080/prefixo//', SUPABASE_MGMT_TIMEOUT_MS: '10', SUPABASE_MGMT_RETRIES: '0', SUPABASE_ACCESS_TOKEN: `  ${TOKEN}\n` });
  assert.equal(c.ref, 'abcdefghij0123456789'); assert.equal(c.urlBase, 'http://localhost:8080/prefixo');
  assert.equal(c.timeoutMs, 10); assert.equal(c.retentativas, 0); assert.equal(c.token, TOKEN, 'espaços/quebra de linha nas pontas são removidos');
  for (const env of [
    { SUPABASE_PROJECT_REF: '../../x' }, { SUPABASE_PROJECT_REF: 'ABCDEFGHIJ0123456789' }, { SUPABASE_PROJECT_REF: 'curto' },
    { SUPABASE_MGMT_API_URL: 'não é url' }, { SUPABASE_MGMT_API_URL: 'http://api.exemplo.com' }, { SUPABASE_MGMT_API_URL: 'ftp://127.0.0.1' },
    { SUPABASE_MGMT_API_URL: 'https://usuario:senha@api.supabase.com' }, { SUPABASE_MGMT_TIMEOUT_MS: '0' }, { SUPABASE_MGMT_RETRIES: '-1' },
    { SUPABASE_MGMT_BACKOFF_MS: 'abc' }, { SUPABASE_MGMT_PAUSA_MS: '1.5' },
  ]) assert.throws(() => lerConfig(env), ErroDeUso, JSON.stringify(env));
});

test('config: token com caractere inválido é recusado sem aparecer na mensagem', () => {
  for (const ruim of ['abc def', 'abc\ndef', 'abcç']) {
    assert.throws(() => lerConfig({ SUPABASE_ACCESS_TOKEN: ruim }), (e) => e instanceof ErroDeUso && !e.message.includes('abc'));
  }
});

// ── argumentos ──────────────────────────────────────────────────────────────────────────────────────
test('args: o padrão é simulação; --apply é explícito', () => {
  assert.deepEqual(lerArgs([]), { aplicar: false, simular: false, ajuda: false, sql: false, dirDdl: DIR_DDL_PADRAO });
  assert.equal(lerArgs(['--apply']).aplicar, true);
  assert.equal(lerArgs(['--dry-run']).aplicar, false);
  assert.equal(lerArgs(['-h']).ajuda, true); assert.equal(lerArgs(['--help']).ajuda, true);
  assert.equal(lerArgs(['--sql']).sql, true);
  assert.equal(lerArgs(['--ddl-dir', '/tmp/x y']).dirDdl, '/tmp/x y');
  assert.equal(lerArgs(['--ddl-dir=/tmp/ação']).dirDdl, '/tmp/ação');
});

test('args: combinações inválidas e flags desconhecidas são erro de uso', () => {
  for (const argv of [['--apply', '--dry-run'], ['--apply', '--sql'], ['--ddl-dir'], ['--ddl-dir='], ['--aplicar'], ['apply'], ['--APPLY']]) {
    assert.throws(() => lerArgs(argv), ErroDeUso, argv.join(' '));
  }
});

test('ordem canônica espelha os \\ir de 99_apply_all.sql', () => {
  const incluidos = [...readFileSync(join(DIR_DDL_PADRAO, '99_apply_all.sql'), 'utf8').matchAll(/^\\ir? (\S+)/gm)].map((m) => m[1]);
  assert.deepEqual(ORDEM_DDL, incluidos);
  assert.deepEqual(emOrdemCanonica(['10_views.sql', '07_policies.sql', '08_functions.sql', '02_tables.sql']), ['02_tables.sql', '10_views.sql', '08_functions.sql', '07_policies.sql']);
});

test('classificarErro: decide por SQLSTATE, não por palavra solta', () => {
  assert.deepEqual(classificarErro('Failed to run sql query: ERROR:  42P07: relation "t" already exists\n'), { sqlstate: '42P07', jaExiste: true });
  assert.deepEqual(classificarErro('ERROR:  42710: policy "p" for table "t" already exists'), { sqlstate: '42710', jaExiste: true });
  assert.deepEqual(classificarErro('ERROR:  23505: duplicate key value violates unique constraint "x"'), { sqlstate: '23505', jaExiste: false });
  assert.deepEqual(classificarErro('ERROR:  42P01: relation "t" does not exist'), { sqlstate: '42P01', jaExiste: false });
  assert.deepEqual(classificarErro('relation "t" already exists'), { sqlstate: null, jaExiste: true });
  assert.deepEqual(classificarErro(undefined), { sqlstate: null, jaExiste: false });
});

// ── cliente HTTP ────────────────────────────────────────────────────────────────────────────────────
test('cliente: POST correto, sucesso devolve as linhas', async () => {
  const f = fetchFalso([resposta(201, [{ t: 3 }])]);
  const cliente = criarCliente(cfgDe({ SUPABASE_PROJECT_REF: 'abcdefghij0123456789' }), { fetchImpl: f });
  assert.deepEqual(await cliente.consultar('select 1'), { tipo: 'ok', linhas: [{ t: 3 }] });
  const { url, init } = f.chamadas[0];
  assert.equal(url, 'http://127.0.0.1:9/v1/projects/abcdefghij0123456789/database/query');
  assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'manual');
  assert.equal(init.headers.Authorization, `Bearer ${TOKEN}`); assert.deepEqual(JSON.parse(init.body), { query: 'select 1' });
  assert.deepEqual(cliente.estatisticas, { requisicoes: 1, retentativas: 0 });
});

test('cliente: erro de SQL (400) não é repetido e traz SQLSTATE', async () => {
  const f = fetchFalso([resposta(400, { message: 'Failed to run sql query: ERROR:  42P01: relation "x" does not exist\n' })]);
  const r = await criarCliente(cfgDe(), { fetchImpl: f }).consultar('select * from x');
  assert.equal(r.tipo, 'sql'); assert.equal(r.sqlstate, '42P01'); assert.equal(r.jaExiste, false); assert.equal(f.chamadas.length, 1);
});

test('cliente: 429 respeita Retry-After; 500/502/503 usam backoff exponencial', async () => {
  const dormir = semEspera();
  const f = fetchFalso([resposta(429, { message: 'calma' }, { 'retry-after': '2' }), resposta(500, 'boom'), resposta(502, '<html>'), resposta(503, ''), resposta(201, [])]);
  const cliente = criarCliente(cfgDe({ SUPABASE_MGMT_BACKOFF_MS: '100' }), { fetchImpl: f, dormir, aleatorio: () => 1 });
  assert.equal((await cliente.consultar('select 1')).tipo, 'ok');
  assert.deepEqual(dormir.esperas, [2000, 200, 400, 800]);
  assert.deepEqual(cliente.estatisticas, { requisicoes: 5, retentativas: 4 });
});

test('cliente: erro de rede é repetido e, esgotado, vira fatal sem lançar', async () => {
  const f = fetchFalso([() => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } }); }]);
  const cliente = criarCliente(cfgDe({ SUPABASE_MGMT_RETRIES: '2' }), { fetchImpl: f, dormir: semEspera() });
  const r = await cliente.consultar('select 1');
  assert.deepEqual(r, { tipo: 'fatal', status: 0, mensagem: 'desisti após 3 tentativa(s): erro de rede (ECONNRESET)' });
  assert.equal(f.chamadas.length, 3);
});

test('cliente: timeout aborta a requisição, repete e relata', async () => {
  const pendurado = (_u, init) => new Promise((_ok, falha) => { init.signal.addEventListener('abort', () => falha(init.signal.reason)); });
  const f = fetchFalso([pendurado, pendurado, resposta(201, [])]);
  const cliente = criarCliente(cfgDe({ SUPABASE_MGMT_TIMEOUT_MS: '20' }), { fetchImpl: f, dormir: semEspera() });
  assert.equal((await cliente.consultar('select 1')).tipo, 'ok');
  assert.equal(cliente.estatisticas.retentativas, 2);
  const sempre = criarCliente(cfgDe({ SUPABASE_MGMT_TIMEOUT_MS: '20', SUPABASE_MGMT_RETRIES: '1' }), { fetchImpl: fetchFalso([pendurado]), dormir: semEspera() });
  assert.equal((await sempre.consultar('select 1')).mensagem, 'desisti após 2 tentativa(s): timeout após 20 ms');
});

test('cliente: 401/403/404 e redirecionamento abortam na hora, com dica e sem repetir', async () => {
  for (const [status, trecho] of [[401, 'token recusado'], [403, 'token recusado'], [404, 'SUPABASE_PROJECT_REF'], [302, 'HTTP 302']]) {
    const f = fetchFalso([resposta(status, { message: 'não' })]);
    const r = await criarCliente(cfgDe(), { fetchImpl: f, dormir: semEspera() }).consultar('select 1');
    assert.equal(r.tipo, 'fatal'); assert.equal(r.status, status); assert.match(r.mensagem, new RegExp(trecho)); assert.equal(f.chamadas.length, 1);
  }
});

test('cliente: corpos inesperados não derrubam (2xx sem JSON, 400 em HTML, retentativas=0)', async () => {
  assert.deepEqual(await criarCliente(cfgDe(), { fetchImpl: fetchFalso([resposta(200, 'ok')]) }).consultar('x'), { tipo: 'ok', linhas: [] });
  const html = await criarCliente(cfgDe(), { fetchImpl: fetchFalso([resposta(400, '<h1>Bad Request</h1>')]) }).consultar('x');
  assert.equal(html.tipo, 'sql'); assert.equal(html.mensagem, '<h1>Bad Request</h1>'); assert.equal(html.sqlstate, null);
  const f = fetchFalso([resposta(503, 'x')]);
  assert.equal((await criarCliente(cfgDe({ SUPABASE_MGMT_RETRIES: '0' }), { fetchImpl: f, dormir: semEspera() }).consultar('x')).tipo, 'fatal');
  assert.equal(f.chamadas.length, 1);
});

// ── execução do plano ───────────────────────────────────────────────────────────────────────────────
/** Cliente falso: `regra(sql, vez)` devolve a resposta; padrão ok. Registra todo SQL recebido. */
function clienteFalso(regra = () => null) {
  const enviados = []; const vezes = new Map();
  return {
    enviados, estatisticas: { requisicoes: 0, retentativas: 0 },
    async consultar(sql) {
      enviados.push(sql); this.estatisticas.requisicoes++;
      const vez = (vezes.get(sql) ?? 0) + 1; vezes.set(sql, vez);
      if (sql === SQL_CONTAR_TABELAS) return regra(sql, vez) ?? { tipo: 'ok', linhas: [{ t: 7 }] };
      return regra(sql, vez) ?? { tipo: 'ok', linhas: [] };
    },
  };
}
const erroSql = (mensagem = 'ERROR:  42P01: relation "x" does not exist') => ({ tipo: 'sql', status: 400, mensagem, ...classificarErro(mensagem) });
const etapa = (titulo, sqls, lote = 1, atomico = false) => ({ titulo, unidades: emUnidades(sqls.map((sql, i) => ({ origem: `${titulo}:${i + 1}`, sql })), lote, atomico) });
async function rodar(etapas, { cliente = clienteFalso(), argv = ['--apply'], estado } = {}) {
  const linhas = [];
  const codigo = await executarPlano({ nome: 'teste.js', etapas, args: lerArgs(argv), cfg: cfgDe(), cliente, escrever: (t) => linhas.push(t), estado });
  return { codigo, texto: linhas.join('\n'), cliente };
}

test('plano: simulação não usa cliente e --sql emite um script SQL válido com tudo que seria enviado', async () => {
  const etapas = [etapa('a.sql', ['CREATE TABLE IF NOT EXISTS t (id int)', "INSERT INTO t VALUES ('a;b')"]), etapa('b.sql', ['select 1', 'select 2', 'select 3'], 2)];
  const sim = await rodar(etapas, { cliente: null, argv: [] });
  assert.equal(sim.codigo, 0); assert.match(sim.texto, /SIMULAÇÃO \(nada é enviado\)/); assert.match(sim.texto, /TOTAL: 5 instrução\(ões\) em 4 requisição\(ões\)/);
  assert.ok(!sim.texto.includes(TOKEN));
  const sql = await rodar(etapas, { cliente: null, argv: ['--sql'] });
  assert.deepEqual(dividirSql(sql.texto).map((s) => s.sql), ['CREATE TABLE IF NOT EXISTS t (id int)', "INSERT INTO t VALUES ('a;b')", 'select 1', 'select 2', 'select 3']);
});

test('plano: tudo ok → saída 0, contagem antes/depois e resumo exato', async () => {
  const r = await rodar([etapa('a.sql', ['select 1', 'select 2', 'select 3'], 2)]);
  assert.equal(r.codigo, 0);
  assert.deepEqual(r.cliente.enviados, [SQL_CONTAR_TABELAS, 'select 1;\nselect 2;', 'select 3;', SQL_CONTAR_TABELAS]);
  assert.match(r.texto, /Tabelas em public antes: 7/); assert.match(r.texto, /Tabelas em public depois: 7 \(\+0\)/);
  assert.match(r.texto, /RESUMO teste\.js: 3 instrução\(ões\) — 3 ok, 0 já existiam, 0 falharam, 0 não executadas/);
  assert.match(r.texto, /Resultado: SUCESSO \(código de saída 0\)$/);
});

test('plano: lote recusado é reenviado 1 a 1; só a instrução ruim falha e é nomeada (saída 1)', async () => {
  const cliente = clienteFalso((sql) => (sql.includes('ruim') ? erroSql() : null));
  const r = await rodar([etapa('a.sql', ['select 1', 'select ruim', 'select 3', 'select 4'], 4)], { cliente });
  assert.equal(r.codigo, 1);
  assert.match(r.texto, /lote recusado pelo banco; reenviado 1 a 1: 3 ok, 1 falharam/);
  assert.match(r.texto, /RESUMO teste\.js: 4 instrução\(ões\) — 3 ok, 0 já existiam, 1 falharam, 0 não executadas/);
  assert.match(r.texto, /FALHOU a\.sql:2: ERROR: 42P01: relation "x" does not exist\n\s+select ruim/);
  assert.match(r.texto, /Resultado: FALHOU \(código de saída 1\)$/);
});

test('plano: unidade atômica não é repartida — o arquivo inteiro conta como falho', async () => {
  const cliente = clienteFalso((sql) => (sql.includes('ruim') ? erroSql() : null));
  const r = await rodar([etapa('a.sql', ['select 1', 'select ruim', 'select 3'], 1, true)], { cliente });
  assert.equal(r.codigo, 1);
  assert.equal(cliente.enviados.filter((s) => s.includes('select 1')).length, 2, '1 envio + 1 repescagem, nunca por partes');
  assert.match(r.texto, /0 ok, 0 já existiam, 3 falharam/); assert.match(r.texto, /arquivo atômico: nada dele foi aplicado, 3 instruções/);
});

test('plano: "já existe" (SQLSTATE 42P07/42710) não é falha', async () => {
  const cliente = clienteFalso((sql) => (sql.includes('t2') ? erroSql('ERROR:  42P07: relation "t2" already exists') : null));
  const r = await rodar([etapa('a.sql', ['create table t1 (id int)', 'create table t2 (id int)'])], { cliente });
  assert.equal(r.codigo, 0); assert.match(r.texto, /JÁ EXISTIA/); assert.match(r.texto, /1 ok, 1 já existiam, 0 falharam/);
});

test('plano: repescagem resolve dependência fora de ordem (falha na 1ª passada, entra na 2ª)', async () => {
  const cliente = clienteFalso((sql, vez) => (sql.includes('indice') && vez === 1 ? erroSql('ERROR:  42883: function f() does not exist') : null));
  const r = await rodar([etapa('03.sql', ['create indice']), etapa('08.sql', ['create funcao'])], { cliente });
  assert.equal(r.codigo, 0); assert.match(r.texto, /\[repescagem 1\] 1 unidade/); assert.match(r.texto, /03\.sql:1 \.\.\. OK \(2ª passada\)/);
  assert.match(r.texto, /2 ok, 0 já existiam, 0 falharam/);
});

test('plano: falha de transporte aborta, não envia o resto e conta como não executadas', async () => {
  const cliente = clienteFalso((sql) => (sql.startsWith('select 2') ? { tipo: 'fatal', status: 0, mensagem: 'desisti após 5 tentativa(s): erro de rede (ECONNREFUSED)' } : null));
  const r = await rodar([etapa('a.sql', ['select 1', 'select 2', 'select 3', 'select 4'])], { cliente });
  assert.equal(r.codigo, 1);
  assert.ok(!cliente.enviados.some((s) => s.startsWith('select 3')), 'nada é enviado depois do aborto');
  assert.match(r.texto, /1 ok, 0 já existiam, 0 falharam, 3 não executadas/); assert.match(r.texto, /ABORTADO: desisti após 5 tentativa/);
});

test('plano: aborto no meio de um lote reenviado conta o restante como não executado', async () => {
  const cliente = clienteFalso((sql) => (sql.includes(';\n') ? erroSql() : sql.startsWith('select 2') ? { tipo: 'fatal', status: 401, mensagem: 'HTTP 401' } : null));
  const r = await rodar([etapa('a.sql', ['select 1', 'select 2', 'select 3'], 3), etapa('b.sql', ['select 9'])], { cliente });
  assert.equal(r.codigo, 1); assert.match(r.texto, /4 instrução\(ões\) — 1 ok, 0 já existiam, 0 falharam, 3 não executadas/);
});

test('plano: credencial recusada na contagem inicial → nenhum DDL é enviado', async () => {
  const cliente = clienteFalso(() => ({ tipo: 'fatal', status: 401, mensagem: 'HTTP 401 — token recusado' }));
  const r = await rodar([etapa('a.sql', ['create table t (id int)'])], { cliente });
  assert.equal(r.codigo, 1); assert.deepEqual(cliente.enviados, [SQL_CONTAR_TABELAS]); assert.match(r.texto, /0 ok, 0 já existiam, 0 falharam, 1 não executadas/);
});

test('plano: interrupção (SIGINT) para antes da próxima requisição e sai com 130', async () => {
  const estado = { parar: null };
  const cliente = clienteFalso((sql) => { if (sql.startsWith('select 2')) estado.parar = 'SIGINT'; return null; });
  const r = await rodar([etapa('a.sql', ['select 1', 'select 2', 'select 3', 'select 4'])], { cliente, estado });
  assert.equal(r.codigo, 130); assert.match(r.texto, /2 ok, 0 já existiam, 0 falharam, 2 não executadas/); assert.match(r.texto, /INTERROMPIDO \(SIGINT\)/);
});

// ── principal ───────────────────────────────────────────────────────────────────────────────────────
const def = { nome: 'teste.js', descricao: 'script de teste.', montarEtapas: () => [etapa('a.sql', ['select 1'])] };
const io = (fetchImpl) => { const out = []; const err = []; return { stdout: { write: (t) => out.push(t) }, stderr: { write: (t) => err.push(t) }, fetchImpl, dormir: semEspera(), out, err }; };

test('principal: --apply sem token → 2, nada enviado; --help → 0; sem flags → simulação sem rede', async () => {
  const f = fetchFalso([resposta(201, [])]);
  let e = io(f);
  assert.equal(await principal(def, ['--apply'], {}, e), 2); assert.match(e.err.join(''), /SUPABASE_ACCESS_TOKEN é obrigatório com --apply/); assert.match(e.err.join(''), /Nada foi enviado/);
  e = io(f); assert.equal(await principal(def, ['--help'], {}, e), 0); assert.match(e.out.join(''), /--apply\s+APLICA no projeto Supabase/);
  e = io(f); assert.equal(await principal(def, [], {}, e), 0); assert.match(e.out.join(''), /SIMULAÇÃO/);
  e = io(f); assert.equal(await principal(def, ['--xyz'], {}, e), 2);
  assert.equal(f.chamadas.length, 0, 'nenhuma requisição em nenhum desses casos');
});

test('principal: o token nunca aparece na saída, nem quando o servidor o devolve na mensagem de erro', async () => {
  const env = { SUPABASE_ACCESS_TOKEN: TOKEN, SUPABASE_MGMT_API_URL: 'http://127.0.0.1:9', SUPABASE_MGMT_PAUSA_MS: '0' };
  const f = fetchFalso([(_u, init) => (JSON.parse(init.body).query === SQL_CONTAR_TABELAS ? resposta(201, [{ t: 1 }]) : resposta(400, { message: `ERROR:  42601: token ${TOKEN} inválido perto de Bearer ${TOKEN}` }))]);
  const e = io(f);
  assert.equal(await principal(def, ['--apply'], env, e), 1);
  const tudo = e.out.join('') + e.err.join('');
  assert.ok(!tudo.includes(TOKEN)); assert.match(tudo, /token \*\*\* inválido/);
  const quebra = io(f);
  assert.equal(await principal({ ...def, montarEtapas: () => { throw new Error(`falha interna com ${TOKEN}`); } }, ['--apply'], env, quebra), 1);
  assert.ok(!quebra.err.join('').includes(TOKEN)); assert.match(quebra.err.join(''), /erro inesperado/);
});

test('principal: ErroDeUso com código 1 (API falhou na preparação) é respeitado', async () => {
  const e = io(fetchFalso([resposta(201, [])]));
  assert.equal(await principal({ ...def, montarEtapas: () => { throw new ErroDeUso('não consegui listar', 1); } }, [], {}, e), 1);
});

test('ehCli: falso quando o módulo é importado por outro (como aqui)', () => {
  assert.equal(ehCli(new URL('./supabase-mgmt.mjs', import.meta.url).href), false);
  assert.equal(ehCli(import.meta.url), true);
});
