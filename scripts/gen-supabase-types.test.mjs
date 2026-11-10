// Testes de scripts/gen-supabase-types.mjs contra um PostgREST de mentira em 127.0.0.1.
// Nunca fala com o Supabase real: toda execução usa SUPABASE_REST_URL apontando para o mock.
// Rodar: node --test scripts/gen-supabase-types.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { gerarTypes, jsonSchemaToTs, chaveTs, MARCA } from './gen-supabase-types.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SCRIPT = join(REPO, 'scripts/gen-supabase-types.mjs');
const CHAVE = 'chave-de-mentira-do-teste-1234567890';

// Recorte fiel do que o PostgREST devolve em GET /rest/v1/ (Swagger 2.0).
const OPENAPI = {
  swagger: '2.0',
  definitions: {
    contacts: {
      required: ['id', 'nome', 'status'],
      properties: {
        id: { format: 'uuid', type: 'string', default: 'gen_random_uuid()', description: 'Note:\nThis is a Primary Key.<pk/>' },
        nome: { format: 'text', type: 'string' },
        idade: { format: 'integer', type: 'integer' },
        saldo: { format: 'numeric', type: 'number' },
        ativo: { format: 'boolean', type: 'boolean' },
        criado_em: { format: 'timestamp with time zone', type: 'string' },
        tags: { format: 'text[]', type: 'array', items: { type: 'string' } },
        extra: { format: 'jsonb' },
        status: { format: 'public.status', type: 'string', enum: ['novo', 'ganho "top"'] },
        'coluna com espaço': { format: 'text', type: 'string' },
      },
      type: 'object',
    },
    'tabela-com-hífen': { properties: { id: { type: 'integer' } }, type: 'object' },
    vw_resumo: { properties: { total: { format: 'bigint', type: 'integer' } }, type: 'object' },
    mv_cache: { properties: { chave: { type: 'string' } }, type: 'object' },
    sem_colunas: { type: 'object' },
    nula: null,
  },
};

async function comMock(t, responder) {
  const pedidos = [];
  const server = createServer((req, res) => { pedidos.push(req); responder(req, res); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return { url: `http://127.0.0.1:${server.address().port}`, pedidos };
}
const json = (corpo, status = 200) => (_req, res) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
};

function rodar(args, env) {
  const limpo = { ...process.env };
  for (const k of ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_HOST', 'SUPABASE_REST_URL', 'GEN_TYPES_OUT']) delete limpo[k];
  return new Promise((resolve) => {
    const filho = spawn(process.execPath, [SCRIPT, ...args], { cwd: tmpdir(), env: { ...limpo, ...env } });
    let out = '', err = '';
    filho.stdout.on('data', (d) => { out += d; });
    filho.stderr.on('data', (d) => { err += d; });
    filho.on('close', (code) => resolve({ code, out, err }));
  });
}
const pasta = (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'gen types ç-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};

test('jsonSchemaToTs: mapeia os tipos do PostgREST para TypeScript válido', () => {
  assert.equal(jsonSchemaToTs({ type: 'integer', format: 'bigint' }), 'number'); // antes: "integer" (não existe em TS)
  assert.equal(jsonSchemaToTs({ type: 'number' }), 'number');
  assert.equal(jsonSchemaToTs({ type: 'string', format: 'uuid' }), 'string');
  assert.equal(jsonSchemaToTs({ type: 'boolean' }), 'boolean');
  assert.equal(jsonSchemaToTs({ format: 'jsonb' }), 'Json');
  assert.equal(jsonSchemaToTs({ format: 'json', type: 'object' }), 'Json');
  assert.equal(jsonSchemaToTs({ type: 'array', items: { type: 'integer' } }), '(number)[]');
  assert.equal(jsonSchemaToTs({ type: 'array' }), '(unknown)[]');
  assert.equal(jsonSchemaToTs({ type: 'string', enum: ['a', 'b"c'] }), '"a" | "b\\"c"');
  assert.equal(jsonSchemaToTs({ type: ['string', 'null'] }), 'string | null');
  assert.equal(jsonSchemaToTs({ $ref: '#/definitions/outra' }), 'unknown');
  assert.equal(jsonSchemaToTs({ type: 'tipo_novo' }), 'unknown');
  for (const vazio of [null, undefined, 'texto', 7]) assert.equal(jsonSchemaToTs(vazio), 'unknown');
  // antes: `{ "a"string; "b": number }` (dois-pontos trocado de lugar)
  assert.equal(jsonSchemaToTs({ type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } }, required: ['a'] }),
    '{ "a": string; "b"?: number }');
  assert.equal(jsonSchemaToTs({ type: 'object' }), 'Record<string, unknown>');
});

test('chaveTs: identificador fica cru, o resto vai entre aspas', () => {
  assert.equal(chaveTs('contact_phones'), 'contact_phones');
  assert.equal(chaveTs('tabela-com-hífen'), '"tabela-com-hífen"');
  assert.equal(chaveTs('1comeca_com_numero'), '"1comeca_com_numero"');
  assert.equal(chaveTs('com "aspas"'), '"com \\"aspas\\""');
});

test('gerarTypes: tabelas x views, nulabilidade, ordem estável e sem carimbo de data', () => {
  const { texto, tabelas, views } = gerarTypes(OPENAPI);
  assert.equal(tabelas, 2);
  assert.equal(views, 2);
  assert.match(texto, /^ {6}contacts: \{\n {8}Row: \{\n {10}id: string;\n {10}nome: string;\n {10}idade: number \| null;/m);
  assert.match(texto, /extra: Json \| null;/);
  assert.match(texto, /tags: \(string\)\[\] \| null;/);
  assert.match(texto, /status: "novo" \| "ganho \\"top\\"";/);
  assert.match(texto, /"coluna com espaço": string \| null;/);
  assert.match(texto, /Insert: \{\n {10}id\?: string;/);
  assert.match(texto, / {6}"tabela-com-hífen": \{/);
  assert.ok(texto.indexOf('mv_cache') < texto.indexOf('vw_resumo'));
  assert.ok(texto.indexOf('Views: {') < texto.indexOf('mv_cache'));
  assert.doesNotMatch(texto, /sem_colunas|nula/);
  assert.equal(texto, gerarTypes(JSON.parse(JSON.stringify(OPENAPI))).texto);
  assert.doesNotMatch(texto, /\d{4}-\d{2}-\d{2}T/);
  assert.ok(texto.endsWith(`${MARCA} (scripts/gen-supabase-types.mjs)\n`));
});

test('gerarTypes: OpenAPI vazio ou torto é recusado (não grava types vazio)', () => {
  for (const ruim of [{}, { definitions: {} }, { definitions: null }, { definitions: { a: null, b: {} } }, null, [], 'x']) {
    assert.throws(() => gerarTypes(ruim), /nenhuma tabela/);
  }
});

test('o types.ts gerado compila no tsc --strict', { skip: !existsSync(join(REPO, 'node_modules/typescript/bin/tsc')) && 'typescript não instalado' }, (t) => {
  const dir = pasta(t);
  writeFileSync(join(dir, 'types.ts'), gerarTypes(OPENAPI).texto);
  writeFileSync(join(dir, 'uso.ts'), [
    "import type { Database } from './types';",
    "type C = Database['public']['Tables']['contacts']['Row'];",
    "export const c: C = { id: 'x', nome: 'n', idade: 1, saldo: null, ativo: true, criado_em: null, tags: ['a'], extra: { k: [1] }, status: 'novo', 'coluna com espaço': null };",
    "export const v: Database['public']['Views']['vw_resumo']['Row'] = { total: 3 };",
  ].join('\n'));
  const r = spawnSync(process.execPath, [join(REPO, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', join(dir, 'uso.ts')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('CLI: lê do mock, manda a chave nos cabeçalhos e grava em --out', async (t) => {
  const mock = await comMock(t, json(OPENAPI));
  const out = join(pasta(t), 'types.ts');
  const r = await rodar(['--out', out], { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: mock.url });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /Tables: 2 {2}Views: 2\nEscrito /);
  assert.equal(readFileSync(out, 'utf8'), gerarTypes(OPENAPI).texto);
  assert.equal(mock.pedidos.length, 1);
  assert.equal(mock.pedidos[0].method, 'GET');
  assert.equal(mock.pedidos[0].url, '/rest/v1/');
  assert.equal(mock.pedidos[0].headers.apikey, CHAVE);
  assert.equal(mock.pedidos[0].headers.authorization, `Bearer ${CHAVE}`);
  assert.doesNotMatch(r.out + r.err, new RegExp(CHAVE));
  // Regravar por cima do próprio arquivo gerado é permitido e idempotente.
  const de_novo = await rodar([], { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: mock.url, GEN_TYPES_OUT: out });
  assert.equal(de_novo.code, 0, de_novo.err);
  assert.equal(readFileSync(out, 'utf8'), gerarTypes(OPENAPI).texto);
});

test('CLI: --stdout imprime só o types.ts e não grava nada', async (t) => {
  const mock = await comMock(t, json(OPENAPI));
  const r = await rodar(['--stdout'], { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: `${mock.url}/` });
  assert.equal(r.code, 0, r.err);
  assert.equal(r.out, gerarTypes(OPENAPI).texto);
});

test('CLI: modo seguro — não sobrescreve arquivo de outra origem sem --force', async (t) => {
  const mock = await comMock(t, json(OPENAPI));
  const out = join(pasta(t), 'types.ts');
  const original = 'export type Database = { public: { Functions: { soma: {} } } }\n';
  writeFileSync(out, original);
  const env = { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: mock.url };
  const r = await rodar(['--out', out], env);
  assert.equal(r.code, 2);
  assert.match(r.err, /não foi gerado por este script/);
  assert.equal(readFileSync(out, 'utf8'), original);
  assert.equal(mock.pedidos.length, 0, 'nem chega a chamar a API');
  const forcado = await rodar(['--out', out, '--force'], env);
  assert.equal(forcado.code, 0, forcado.err);
  assert.match(readFileSync(out, 'utf8'), /contacts: \{/);
});

test('CLI: o destino padrão (types.ts do app) fica protegido', async (t) => {
  const mock = await comMock(t, json(OPENAPI));
  const real = join(REPO, 'src/integrations/supabase/types.ts');
  const antes = readFileSync(real, 'utf8');
  const r = await rodar([], { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: mock.url });
  assert.equal(r.code, 2);
  assert.equal(readFileSync(real, 'utf8'), antes);
  assert.equal(mock.pedidos.length, 0);
});

test('CLI: sem chave (ou só espaços) sai 2 sem tocar na rede', async (t) => {
  const mock = await comMock(t, json(OPENAPI));
  for (const chave of [undefined, '', '   ']) {
    const r = await rodar(['--stdout'], { SUPABASE_REST_URL: mock.url, ...(chave === undefined ? {} : { SUPABASE_SERVICE_ROLE_KEY: chave }) });
    assert.equal(r.code, 2);
    assert.match(r.err, /Defina SUPABASE_SERVICE_ROLE_KEY/);
  }
  assert.equal(mock.pedidos.length, 0);
});

const FALHAS = {
  'HTTP 401 (chave errada)': [json({ message: `Invalid API key ${CHAVE}` }, 401), 1, /HTTP 401/],
  'HTTP 500': [json('erro interno', 500), 1, /HTTP 500/],
  'JSON inválido': [json('<html>não é json</html>'), 1, /não é JSON válido/],
  'JSON sem definitions': [json({ swagger: '2.0' }), 2, /nenhuma tabela/],
  'conexão derrubada no meio': [(req, res) => { res.writeHead(200); res.write('{"defin'); req.socket.destroy(); }, 1, /falha de rede|não é JSON/],
};
for (const [nome, [responder, codigo, mensagem]] of Object.entries(FALHAS)) {
  test(`CLI: ${nome} falha sem gravar e sem vazar a chave`, async (t) => {
    const mock = await comMock(t, responder);
    const out = join(pasta(t), 'types.ts');
    const r = await rodar(['--out', out], { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: mock.url });
    assert.equal(r.code, codigo, r.err);
    assert.match(r.err, mensagem);
    assert.doesNotMatch(r.out + r.err, new RegExp(CHAVE));
    assert.equal(existsSync(out), false);
  });
}

test('CLI: porta sem ninguém ouvindo falha com mensagem de rede', async () => {
  const r = await rodar(['--stdout'], { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: 'http://127.0.0.1:1' });
  assert.equal(r.code, 1);
  assert.match(r.err, /falha de rede: ECONNREFUSED/);
});

test('CLI: servidor que nunca responde estoura o timeout em vez de travar', async (t) => {
  const mock = await comMock(t, () => {});
  const r = await rodar(['--stdout'], { SUPABASE_SERVICE_ROLE_KEY: CHAVE, SUPABASE_REST_URL: mock.url, GEN_TYPES_TIMEOUT_MS: '300' });
  assert.equal(r.code, 1);
  assert.match(r.err, /falha de rede: sem resposta em 0\.3s/);
});

test('CLI: SUPABASE_REST_URL fora do loopback e SUPABASE_HOST malformado são recusados antes de qualquer rede', async () => {
  const env = { SUPABASE_SERVICE_ROLE_KEY: CHAVE };
  for (const url of ['https://exemplo.invalid', 'http://10.0.0.1:3000', 'ftp://127.0.0.1', 'não é url']) {
    const r = await rodar(['--stdout'], { ...env, SUPABASE_REST_URL: url });
    assert.equal(r.code, 2, url);
    assert.match(r.err, /SUPABASE_REST_URL/);
  }
  for (const host of ['https://x.supabase.co', 'x.supabase.co/rest', 'x.supabase.co:443', 'a b']) {
    const r = await rodar(['--stdout'], { ...env, SUPABASE_HOST: host });
    assert.equal(r.code, 2, host);
    assert.match(r.err, /SUPABASE_HOST deve ser só o nome do host/);
  }
});

test('CLI: --out sem valor sai 2; --help sai 0 sem exigir chave', async () => {
  assert.equal((await rodar(['--out'], { SUPABASE_SERVICE_ROLE_KEY: CHAVE })).code, 2);
  const ajuda = await rodar(['--help'], {});
  assert.equal(ajuda.code, 0);
  assert.match(ajuda.out, /Uso:/);
});
