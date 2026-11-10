// Testes do detector de regressão de exposição RLS (check-rls-baseline.mjs) contra um PostgREST
// de mentira em 127.0.0.1. Roda o script real (não uma cópia) com RLS_BASELINE_FILE em tmp.
// Rodar: node --test scripts/rls-matrix/check-rls-baseline.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(AQUI, 'check-rls-baseline.mjs');
const BASELINE_REAL = join(AQUI, 'rls-baseline.json');
const ANON = 'chave-anon-de-mentira';
const JWT = 'jwt-de-mentira-do-usuario-de-teste';

const linhas = (n) => (_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(Array.from({ length: n }, () => ({})))); };
const negado = (status = 403) => (_req, res) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end('{"code":"42501","message":"permission denied"}'); };
const status = (codigo, corpo = '{}') => (_req, res) => { res.writeHead(codigo, { 'Content-Type': 'application/json' }); res.end(corpo); };

/** Sobe o mock. `rotas(tabela, perfil, tentativa)` devolve o handler da resposta. */
async function mock(t, rotas) {
  const pedidos = [];
  const tentativas = new Map();
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const tabela = decodeURIComponent(url.pathname.replace('/rest/v1/', ''));
    const perfil = req.headers.authorization === `Bearer ${JWT}` ? 'authenticated_sem_role' : 'anon';
    const chave = `${tabela}/${perfil}`;
    tentativas.set(chave, (tentativas.get(chave) ?? 0) + 1);
    pedidos.push({ tabela, perfil, url: req.url, headers: req.headers });
    rotas(tabela, perfil, tentativas.get(chave))(req, res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return { url: `http://127.0.0.1:${server.address().port}`, pedidos, tentativas };
}

function rodar(t, { url, baseline, args = [], env = {}, arquivo } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rls baseline ç-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const arq = arquivo ?? join(dir, 'rls-baseline.json');
  if (baseline !== undefined) writeFileSync(arq, typeof baseline === 'string' ? baseline : JSON.stringify(baseline));
  const limpo = { ...process.env };
  for (const k of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TEST_USER_JWT', 'RLS_BASELINE_FILE']) delete limpo[k];
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, [SCRIPT, ...args], {
      cwd: tmpdir(),
      env: { ...limpo, SUPABASE_URL: url, SUPABASE_ANON_KEY: ANON, TEST_USER_JWT: JWT, RLS_BASELINE_FILE: arq, RLS_RETRY_DELAY_MS: '5', ...env },
    });
    let out = '', err = '';
    filho.stdout.on('data', (d) => { out += d; });
    filho.stderr.on('data', (d) => { err += d; });
    filho.on('close', (code) => resolve({ code, out, err, arq, ler: () => readFileSync(arq, 'utf8') }));
  });
}

const base = (tabelas, meta = { gerado_em: '2026-01-01' }) => ({ _meta: meta, tabelas });
const DOIS = base({ contacts: { anon: -1, authenticated_sem_role: 0 }, suppliers: { anon: -1, authenticated_sem_role: 3 } });
const fiel = (tabela, perfil) => (perfil === 'anon' ? negado(401) : linhas(tabela === 'suppliers' ? 3 : 0));

test('aprova quando o que cada perfil enxerga bate com o baseline', async (t) => {
  const m = await mock(t, fiel);
  const r = await rodar(t, { url: m.url, baseline: DOIS });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /ok: 2 tabelas, 2 perfil\(is\), nenhuma regressao/);
  assert.equal(m.pedidos.length, 4);
  assert.equal(m.pedidos[0].url, '/rest/v1/contacts?select=*&limit=1001');
  for (const p of m.pedidos) assert.equal(p.headers.apikey, ANON);
  assert.deepEqual(m.pedidos.map((p) => p.headers.authorization), [`Bearer ${ANON}`, `Bearer ${JWT}`, `Bearer ${ANON}`, `Bearer ${JWT}`]);
  assert.doesNotMatch(r.out + r.err, new RegExp(`${JWT}|${ANON}`));
});

const REGRESSOES = {
  'usuário logado passa a ver linhas (0 -> 2)': [(tb, p) => (p === 'anon' ? negado(401) : linhas(tb === 'contacts' ? 2 : 3)), /contacts \[authenticated_sem_role\]: 0 -> 2/],
  'mais linhas que antes (3 -> 4)': [(tb, p) => (p === 'anon' ? negado(401) : linhas(tb === 'suppliers' ? 4 : 0)), /suppliers \[authenticated_sem_role\]: 3 -> 4/],
  'anon ganha grant, mesmo sem linha (-1 -> 0)': [(tb, p) => (p === 'anon' ? linhas(0) : fiel(tb, p)), /contacts \[anon\]: -1 -> 0/],
  'anon passa a ler dados (-1 -> 5)': [(tb, p) => (p === 'anon' && tb === 'suppliers' ? linhas(5) : fiel(tb, p)), /suppliers \[anon\]: -1 -> 5/],
};
for (const [nome, [rotas, esperado]] of Object.entries(REGRESSOES)) {
  test(`reprova: ${nome}`, async (t) => {
    const m = await mock(t, rotas);
    const r = await rodar(t, { url: m.url, baseline: DOIS });
    assert.equal(r.code, 1);
    assert.match(r.err, /REGRESSAO DE EXPOSICAO/);
    assert.match(r.err, esperado);
    assert.equal(r.ler(), JSON.stringify(DOIS), 'sem --update o baseline não muda');
  });
}

test('exposição menor: aprova, avisa e --update fixa o novo patamar', async (t) => {
  const rotas = (tb, p) => (p === 'anon' ? negado(401) : (tb === 'suppliers' ? negado(403) : linhas(0)));
  const m = await mock(t, rotas);
  const r = await rodar(t, { url: m.url, baseline: DOIS });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /exposicao reduzida.*\n\s+suppliers \[authenticated_sem_role\]: 3 -> -1/);
  const u = await rodar(t, { url: m.url, baseline: DOIS, args: ['--update'] });
  assert.equal(u.code, 0, u.err);
  const novo = JSON.parse(u.ler());
  assert.equal(novo.tabelas.suppliers.authenticated_sem_role, -1);
  assert.equal(novo.tabelas.contacts.anon, -1);
  assert.match(novo._meta.gerado_em, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(u.ler().endsWith('}\n'));
});

test('--update com piora grava, mas deixa a regressão aceita escrita no stderr', async (t) => {
  const m = await mock(t, (tb, p) => (p === 'anon' ? negado(401) : linhas(9)));
  const r = await rodar(t, { url: m.url, baseline: base(DOIS.tabelas, undefined), args: ['--update'] });
  assert.equal(r.code, 0, r.err);
  assert.match(r.err, /REGRESSAO ACEITA PELO --update \(2\)/);
  assert.equal(JSON.parse(r.ler()).tabelas.contacts.authenticated_sem_role, 9);
  assert.ok(JSON.parse(r.ler())._meta.gerado_em, 'baseline sem _meta não derruba o --update');
});

for (const passageiro of [429, 500, 502, 503, 504]) {
  test(`HTTP ${passageiro} passageiro: tenta de novo e aprova`, async (t) => {
    const m = await mock(t, (tb, p, n) => (tb === 'contacts' && p === 'anon' && n <= 2 ? status(passageiro) : fiel(tb, p)));
    const r = await rodar(t, { url: m.url, baseline: DOIS });
    assert.equal(r.code, 0, r.err);
    assert.equal(m.tentativas.get('contacts/anon'), 3);
  });
}

test('conexão derrubada uma vez: tenta de novo e aprova', async (t) => {
  // Antes: qualquer erro de rede reprovava na primeira tentativa (só HTTP 500 tinha retry).
  const m = await mock(t, (tb, p, n) => (tb === 'suppliers' && p === 'anon' && n === 1 ? (req) => req.socket.destroy() : fiel(tb, p)));
  const r = await rodar(t, { url: m.url, baseline: DOIS });
  assert.equal(r.code, 0, r.err);
  assert.equal(m.tentativas.get('suppliers/anon'), 2);
});

const INCOMPLETAS = {
  'erro 503 que não passa': [() => status(503), {}, /contacts\/anon: http 503/, 12],
  'servidor que não responde (timeout)': [(tb, p) => (tb === 'contacts' && p === 'anon' ? () => {} : fiel(tb, p)), { RLS_TIMEOUT_MS: '150' }, /contacts\/anon: rede: sem resposta em 150 ms/, 6],
  'tabela que sumiu (404)': [(tb, p) => (tb === 'contacts' ? status(404, '{"code":"PGRST205"}') : fiel(tb, p)), {}, /contacts\/anon: http 404 \(a tabela nao existe mais\?/, 4],
  'JWT expirado (401 sem 42501)': [(tb, p) => (p === 'anon' ? negado(401) : status(401, '{"code":"PGRST303"}')), {}, /autenticacao\/permissao nao confirmada: http 401/, 4],
  'resposta que não é lista': [(tb, p) => (p === 'anon' ? negado(401) : status(200, '{"a":1}')), {}, /resposta nao e uma lista/, 4],
  'corpo que não é JSON': [(tb, p) => (p === 'anon' ? negado(401) : status(200, '<html>')), {}, /JSON invalido/, 4],
};
for (const [nome, [rotas, env, esperado, pedidos]] of Object.entries(INCOMPLETAS)) {
  for (const args of [[], ['--update']]) {
    test(`coleta incompleta (${nome})${args.length ? ' com --update' : ''}: reprova e preserva o baseline`, async (t) => {
      const m = await mock(t, rotas);
      const r = await rodar(t, { url: m.url, baseline: DOIS, env, args });
      assert.equal(r.code, 1);
      assert.match(r.err, /VERIFICACAO INCOMPLETA/);
      assert.match(r.err, esperado);
      assert.doesNotMatch(r.out, /nenhuma regressao|baseline atualizado/);
      assert.equal(r.ler(), JSON.stringify(DOIS));
      assert.equal(m.pedidos.length, pedidos);
    });
  }
}

test('porta sem ninguém ouvindo: reprova como coleta incompleta', async (t) => {
  const r = await rodar(t, { url: 'http://127.0.0.1:1', baseline: base({ contacts: { anon: -1 } }), env: { TEST_USER_JWT: '' } });
  assert.equal(r.code, 1);
  assert.match(r.err, /VERIFICACAO INCOMPLETA \(1\):\n\s+contacts\/anon: rede: /);
});

test('SUPABASE_URL com barra no fim e nome de tabela com caractere especial', async (t) => {
  const m = await mock(t, () => linhas(0));
  const r = await rodar(t, { url: undefined, baseline: base({ 'tabela com espaço&x=1': { anon: 0 } }), env: { TEST_USER_JWT: '' } });
  assert.equal(r.code, 2, 'sem SUPABASE_URL');
  const ok = await rodar(t, { url: `${m.url}///`, baseline: base({ 'tabela com espaço&x=1': { anon: 0 } }), env: { TEST_USER_JWT: '' } });
  assert.equal(ok.code, 0, ok.err);
  assert.equal(m.pedidos[0].url, '/rest/v1/tabela%20com%20espa%C3%A7o%26x%3D1?select=*&limit=1001');
});

test('variáveis obrigatórias ausentes: exit 2 sem chamar a rede', async (t) => {
  const m = await mock(t, fiel);
  for (const env of [{ SUPABASE_URL: '' }, { SUPABASE_ANON_KEY: '' }]) {
    const r = await rodar(t, { url: m.url, baseline: DOIS, env });
    assert.equal(r.code, 2);
    assert.match(r.err, /faltam SUPABASE_URL e SUPABASE_ANON_KEY/);
  }
  assert.equal(m.pedidos.length, 0);
});

const BASELINES_RUINS = {
  'arquivo ausente': [undefined, /nao consegui ler o baseline/],
  'JSON quebrado': ['{"tabelas": {', /nao consegui ler o baseline/],
  'arquivo vazio': ['', /nao consegui ler o baseline/],
  'sem tabelas': [{ _meta: {} }, /sem "tabelas"/],
  'tabelas vazio': [{ tabelas: {} }, /sem "tabelas"/],
  'tabelas como lista': [{ tabelas: ['contacts'] }, /sem "tabelas"/],
  'tabela sem perfis': [{ tabelas: { contacts: {} } }, /"contacts" precisa de um objeto/],
  'valor null': [{ tabelas: { contacts: { anon: null } } }, /contacts\.anon = null/],
  'valor em texto': [{ tabelas: { contacts: { anon: '0' } } }, /contacts\.anon = "0"/],
  'valor fracionário': [{ tabelas: { contacts: { anon: 1.5 } } }, /contacts\.anon = 1\.5/],
  'valor menor que -1': [{ tabelas: { contacts: { anon: -2 } } }, /contacts\.anon = -2/],
};
for (const [nome, [baseline, esperado]] of Object.entries(BASELINES_RUINS)) {
  test(`baseline inválido (${nome}): exit 2 sem chamar a rede`, async (t) => {
    const m = await mock(t, () => linhas(1000));
    const r = await rodar(t, { url: m.url, baseline, args: ['--update'] });
    assert.equal(r.code, 2);
    assert.match(r.err, /BASELINE INVALIDO/);
    assert.match(r.err, esperado);
    assert.equal(m.pedidos.length, 0);
  });
}

test('o baseline versionado é válido e passa quando o banco responde exatamente o que ele registra', async (t) => {
  const real = JSON.parse(readFileSync(BASELINE_REAL, 'utf8'));
  const antes = readFileSync(BASELINE_REAL, 'utf8');
  const m = await mock(t, (tb, p) => {
    const n = real.tabelas[tb]?.[p];
    return n === -1 ? negado(p === 'anon' ? 401 : 403) : linhas(n);
  });
  const total = Object.keys(real.tabelas).length;
  const ok = await rodar(t, { url: m.url, arquivo: BASELINE_REAL });
  assert.equal(ok.code, 0, ok.err);
  assert.match(ok.out, new RegExp(`ok: ${total} tabelas, 2 perfil\\(is\\), nenhuma regressao`));
  assert.equal(m.pedidos.length, total * 2);
  // E reprova se UMA tabela do baseline real abrir para o anon.
  const alvo = Object.keys(real.tabelas).find((tb) => real.tabelas[tb].anon === -1);
  const m2 = await mock(t, (tb, p) => (tb === alvo && p === 'anon' ? linhas(1) : (real.tabelas[tb][p] === -1 ? negado(403) : linhas(real.tabelas[tb][p]))));
  const ruim = await rodar(t, { url: m2.url, arquivo: BASELINE_REAL });
  assert.equal(ruim.code, 1);
  assert.match(ruim.err, new RegExp(`${alvo} \\[anon\\]: -1 -> 1`));
  assert.equal(readFileSync(BASELINE_REAL, 'utf8'), antes);
});

test('--help sai 0 sem exigir variáveis', async (t) => {
  const r = await rodar(t, { url: '', baseline: DOIS, args: ['--help'], env: { SUPABASE_ANON_KEY: '' } });
  assert.equal(r.code, 0);
  assert.match(r.out, /Uso:/);
});
