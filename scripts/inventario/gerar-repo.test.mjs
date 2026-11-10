// Testes de scripts/inventario/gerar-repo.mjs num repositório de mentira (INVENTARIO_RAIZ).
// Precisa do ripgrep (rg); sem ele os testes se pulam. Rodar: node --test scripts/inventario/gerar-repo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = join(AQUI, '..', '..');
const SCRIPT = join(AQUI, 'gerar-repo.mjs');
const opcoes = { skip: spawnSync('rg', ['--version']).status !== 0 && 'ripgrep (rg) não instalado' };

const BASE = {
  'supabase/functions/envia-email/index.ts': "const a = Deno.env.get('RESEND_API_KEY');\nconst b = Deno.env.get(\"SUPABASE_URL\");\nDeno.env.get('RESEND_API_KEY');\ndb.from('emails');",
  'supabase/functions/so-cron/index.ts': "db.from('emails'); db.from(`contacts`);",
  'supabase/functions/sem-chamador/index.ts': 'export {};',
  'supabase/functions/a.b/index.ts': 'export {};',
  'supabase/functions/_shared/util.ts': "export const destino = 'envia-email';\ndb.from('contacts')",
  'supabase/functions/sem-index/outro.ts': "fetch('/functions/v1/sem-chamador')",
  'supabase/functions/orquestra/index.ts': "fetch(`${url}/functions/v1/so-cron`);",
  'supabase/migrations/20261101000000_cron.sql': "select net.http_post('https://x/functions/v1/so-cron');",
  'supabase/config.toml': '[functions.envia-email]\nverify_jwt = true\n',
  '.github/workflows/ci.yml': 'run: curl https://x/functions/v1/envia-email\n',
  'e2e/fluxo.spec.ts': "await page.route('**/functions/v1/envia-email', h);",
  'src/a.ts': "supabase.functions.invoke('envia-email');\nsupabase.from('contacts').select();\nsupabase.from(\"contacts\");\nsupabase.from('contacts_extra');",
  'src/b.tsx': "chamar('orquestra', {});\nfetch('/functions/v1/axb');\nsupabase.from('emails')",
  'src/integrations/supabase/types.ts': '      contacts: {\n        Row: {}\n      }\n      emails: {\n',
};

function repo(t, arquivos = BASE, nome = 'inv repo com espaço ç-') {
  const dir = mkdtempSync(join(tmpdir(), nome));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo);
  }
  return dir;
}
function rodar(raiz, { stdin = '', args = [], cwd = tmpdir(), env = {} } = {}) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, input: stdin, encoding: 'utf8', env: { ...process.env, INVENTARIO_RAIZ: raiz, ...env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const ler = (dir, nome) => JSON.parse(readFileSync(join(dir, 'inventario/estado', nome), 'utf8'));

test('edges.json: linhas, segredos lidos e quem chama cada função', opcoes, (t) => {
  const dir = repo(t);
  const r = rodar(dir);
  assert.equal(r.code, 0, r.err);
  assert.equal(r.out, 'edges: 5 | sem chamador no repo (src/migrations/edges): 1\n');
  const e = ler(dir, 'edges.json');
  assert.match(e.gerado_em, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(Object.keys(e), ['gerado_em', 'total', 'sem_chamador_no_repo', 'edge_functions']);
  assert.deepEqual(Object.keys(e.edge_functions), ['a.b', 'envia-email', 'orquestra', 'sem-chamador', 'so-cron'], '_shared e pasta sem index.ts ficam de fora');
  assert.deepEqual(e.edge_functions['envia-email'], {
    linhas: 4, segredos_lidos: ['RESEND_API_KEY', 'SUPABASE_URL'],
    chamada_em: { src: 1, migrations: 0, outras_edges: 1, e2e: 1, ci_config: 2 }, sem_chamador: false,
  });
  assert.deepEqual(e.edge_functions['so-cron'].chamada_em, { src: 0, migrations: 1, outras_edges: 1, e2e: 0, ci_config: 0 });
  assert.deepEqual(e.edge_functions.orquestra.chamada_em, { src: 1, migrations: 0, outras_edges: 0, e2e: 0, ci_config: 0 });
  // "sem-chamador" é citada por outra pasta de função (sem-index), então tem chamador. "a.b" tem ponto:
  // o nome vai escapado para a regex e não casa com "axb" em src/b.tsx.
  assert.deepEqual(e.sem_chamador_no_repo, ['a.b']);
  assert.equal(existsSync(join(dir, 'inventario/estado/tabelas-uso.json')), false, 'sem stdin não gera tabelas-uso');
});

test('tabelas-uso.json: conta .from() em src e edges e confere o types.ts', opcoes, (t) => {
  const dir = repo(t);
  const r = rodar(dir, { stdin: 'contacts\nemails\n\n  orfa  \ncontacts\na.b\n' });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /\ntabelas: 4 \| sem \.from\(\) em src nem edges: 2\n$/);
  const u = ler(dir, 'tabelas-uso.json');
  assert.deepEqual(Object.keys(u), ['gerado_em', 'total', 'sem_from_em_src_nem_edges', 'tabelas']);
  assert.deepEqual(u.tabelas.contacts, { from_src: 2, from_edges: 2, em_types_ts: true }, 'contacts_extra não conta como contacts');
  assert.deepEqual(u.tabelas.emails, { from_src: 1, from_edges: 2, em_types_ts: true });
  assert.deepEqual(u.tabelas.orfa, { from_src: 0, from_edges: 0, em_types_ts: false });
  assert.deepEqual(u.sem_from_em_src_nem_edges, ['orfa', 'a.b']);
  assert.equal(u.total, 4, 'nome repetido no stdin conta uma vez');
});

test('nomes hostis no stdin (começando com -, com regex, __proto__) não quebram nem viram opção do rg', opcoes, (t) => {
  const dir = repo(t);
  const r = rodar(dir, { stdin: '--files\n-e\nfoo(bar\nx[y\n__proto__\nconstructor\npipe|star*\n' });
  assert.equal(r.code, 0, r.err);
  const u = ler(dir, 'tabelas-uso.json');
  assert.equal(u.total, 7);
  assert.deepEqual(Object.keys(u.tabelas), ['--files', '-e', 'foo(bar', 'x[y', '__proto__', 'constructor', 'pipe|star*']);
  for (const v of Object.values(u.tabelas)) assert.deepEqual(v, { from_src: 0, from_edges: 0, em_types_ts: false });
});

test('repositório mínimo (sem src, e2e, migrations, workflows, types.ts) funciona', opcoes, (t) => {
  const dir = repo(t, { 'supabase/functions/unica/index.ts': 'export {};' });
  const r = rodar(dir, { stdin: 'contacts' });
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(ler(dir, 'edges.json').edge_functions.unica.chamada_em, { src: 0, migrations: 0, outras_edges: 0, e2e: 0, ci_config: 0 });
  assert.deepEqual(ler(dir, 'tabelas-uso.json').tabelas.contacts, { from_src: 0, from_edges: 0, em_types_ts: false });
  const vazio = repo(t, { 'supabase/functions/.gitkeep': '' });
  assert.equal(rodar(vazio).out, 'edges: 0 | sem chamador no repo (src/migrations/edges): 0\n');
});

test('--saida grava em outra pasta; fora do carimbo, duas execuções dão o mesmo conteúdo', opcoes, (t) => {
  const dir = repo(t);
  const saida = join(dir, 'outra saída');
  const semData = (nome) => JSON.stringify({ ...JSON.parse(readFileSync(join(saida, nome), 'utf8')), gerado_em: null });
  assert.equal(rodar(dir, { stdin: 'contacts', args: ['--saida', saida], cwd: dir }).code, 0);
  const antes = [semData('edges.json'), semData('tabelas-uso.json')];
  assert.equal(rodar(dir, { stdin: 'contacts', args: ['--saida', saida], cwd: join(dir, 'src') }).code, 0);
  assert.deepEqual([semData('edges.json'), semData('tabelas-uso.json')], antes);
  assert.equal(existsSync(join(dir, 'inventario')), false);
  assert.ok(readFileSync(join(saida, 'edges.json'), 'utf8').endsWith('}\n'));
});

test('falhas saem com 2 e "ERRO:": raiz sem supabase/functions, --saida sem valor, rg ausente', opcoes, (t) => {
  const semFuncoes = repo(t, { 'src/a.ts': 'x' });
  const r = rodar(semFuncoes);
  assert.equal(r.code, 2);
  assert.match(r.err, /^ERRO: .*supabase\/functions não existe/);
  assert.equal(existsSync(join(semFuncoes, 'inventario')), false, 'nada é criado quando falha');
  assert.equal(rodar(repo(t), { args: ['--saida'] }).code, 2);
  const dir = repo(t);
  const semRg = rodar(dir, { env: { PATH: dirname(process.execPath) === dirname(spawnSync('which', ['rg'], { encoding: 'utf8' }).stdout.trim()) ? '' : dirname(process.execPath) } });
  assert.equal(semRg.code, 2);
  assert.match(semRg.err, /^ERRO: ripgrep \(rg\) não encontrado/);
  assert.equal(existsSync(join(dir, 'inventario')), false);
  const ajuda = rodar(dir, { args: ['--help'] });
  assert.equal(ajuda.code, 0);
  assert.match(ajuda.out, /Uso:/);
});

test('stdin por pipe lento não vira EAGAIN', opcoes, (t) => {
  const dir = repo(t);
  const r = spawnSync('bash', ['-c', `(sleep 0.3; echo contacts) | "${process.execPath}" "${SCRIPT}"`], { encoding: 'utf8', env: { ...process.env, INVENTARIO_RAIZ: dir } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /tabelas: 1 \|/);
});

test('no repositório real, gravando em tmp: bate com as edge functions e não toca em inventario/estado', opcoes, (t) => {
  const saida = mkdtempSync(join(tmpdir(), 'inv-real-'));
  t.after(() => rmSync(saida, { recursive: true, force: true }));
  const alvo = join(REPO, 'inventario/estado/edges.json');
  const antes = existsSync(alvo) ? statSync(alvo).mtimeMs : null;
  const r = spawnSync(process.execPath, [SCRIPT, '--saida', saida], { cwd: tmpdir(), input: 'contacts\n', encoding: 'utf8', env: { ...process.env, INVENTARIO_RAIZ: '' } });
  assert.equal(r.status, 0, r.stderr);
  const e = JSON.parse(readFileSync(join(saida, 'edges.json'), 'utf8'));
  assert.ok(e.total >= 50, `total=${e.total}`);
  assert.ok(e.edge_functions.health, 'health existe no repo');
  const u = JSON.parse(readFileSync(join(saida, 'tabelas-uso.json'), 'utf8'));
  assert.ok(u.tabelas.contacts.from_src > 0 && u.tabelas.contacts.em_types_ts);
  assert.equal(existsSync(alvo) ? statSync(alvo).mtimeMs : null, antes);
});
