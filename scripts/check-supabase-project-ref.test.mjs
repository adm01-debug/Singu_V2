// Garante que o projeto Supabase canônico é um só em todo o repositório.
// Fonte da verdade: a linha "Supabase canônico: `<ref>`" do AGENTS.md. Devem apontar para o mesmo ref:
// supabase/config.toml (project_id), supabase/.temp/linked-project.json (ref), a CSP do vite.config.ts,
// o index.html e os scripts que trazem o projeto embutido. Nenhum outro `<ref>.supabase.co` pode aparecer neles.
// SINGU_REPO_ROOT troca a raiz lida: só existe para este arquivo provar, em cópia adulterada, que reprova.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const real = dirname(dirname(fileURLToPath(import.meta.url)));
const root = process.env.SINGU_REPO_ROOT || real;
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const canonical = /Supabase canônico: `([a-z0-9]{20})`/.exec(read('AGENTS.md'))?.[1];

test('AGENTS.md declara o projeto Supabase canônico', () => {
  assert.ok(canonical, 'AGENTS.md precisa conter: Supabase canônico: `<ref de 20 caracteres>`');
});

test('supabase/config.toml aponta para o projeto canônico', () => {
  const id = /^project_id\s*=\s*"([^"]+)"/m.exec(read('supabase/config.toml'))?.[1];
  assert.equal(id, canonical, `project_id=${id} diverge do canônico ${canonical}`);
});

test('supabase/.temp/linked-project.json aponta para o projeto canônico', () => {
  const ref = JSON.parse(read('supabase/.temp/linked-project.json')).ref;
  assert.equal(ref, canonical, `linked-project ref=${ref} diverge do canônico ${canonical}`);
});

test('a CSP do vite.config.ts permite conexão ao projeto canônico', () => {
  assert.match(read('vite.config.ts'), new RegExp(`${canonical}\\.supabase\\.co`), 'vite.config.ts não permite o host canônico');
});

// Arquivos em que um segundo projeto passaria despercebido pelos testes acima (que só exigem a presença do canônico).
const COM_HOST = ['vite.config.ts', 'index.html', 'scripts/gen-supabase-types.mjs', 'scripts/audit-ausentes.mjs', 'supabase/config.toml'];

test('nenhum outro projeto Supabase aparece na CSP, no index.html e nos scripts', () => {
  for (const rel of COM_HOST) {
    if (!existsSync(join(root, rel))) continue;
    const refs = [...new Set([...read(rel).matchAll(/\b([a-z0-9]{20})\.supabase\.co\b/g)].map((m) => m[1]))];
    assert.deepEqual(refs.filter((ref) => ref !== canonical), [], `${rel} cita outro projeto Supabase`);
  }
});

test('os scripts com o projeto embutido usam o canônico', () => {
  assert.equal(/PROJETO_OFICIAL = '([a-z0-9]+)'/.exec(read('scripts/inventario/gerar-banco.mjs'))?.[1], canonical);
  assert.equal(/HOST_PADRAO = "([a-z0-9]+)\.supabase\.co"/.exec(read('scripts/gen-supabase-types.mjs'))?.[1], canonical);
});

// ─── O outro lado: cada divergência plantada numa cópia tem de reprovar ──────
const OUTRO = 'abcdefghijklmnopqrst';
const ARQUIVOS = ['AGENTS.md', 'supabase/config.toml', 'supabase/.temp/linked-project.json', 'vite.config.ts', 'index.html',
  'scripts/gen-supabase-types.mjs', 'scripts/audit-ausentes.mjs', 'scripts/inventario/gerar-banco.mjs'];
const DIVERGENCIAS = {
  'config.toml com outro project_id': ['supabase/config.toml', (t) => t.replace(/^project_id\s*=\s*"[^"]+"/m, `project_id = "${OUTRO}"`)],
  'linked-project.json com outro ref': ['supabase/.temp/linked-project.json', (t) => t.replace(canonical, OUTRO)],
  'linked-project.json quebrado': ['supabase/.temp/linked-project.json', () => '{'],
  'CSP do vite sem o canônico': ['vite.config.ts', (t) => t.replaceAll(canonical, OUTRO)],
  'CSP do vite com um segundo projeto': ['vite.config.ts', (t) => `${t}\n// https://${OUTRO}.supabase.co\n`],
  'index.html com um segundo projeto': ['index.html', (t) => t.replace(canonical, OUTRO)],
  'AGENTS.md sem a linha do canônico': ['AGENTS.md', (t) => t.replace('Supabase canônico', 'Supabase oficial')],
  'AGENTS.md trocando o canônico': ['AGENTS.md', (t) => t.replace(canonical, OUTRO)],
  'gerar-banco com outro projeto': ['scripts/inventario/gerar-banco.mjs', (t) => t.replace(`'${canonical}'`, `'${OUTRO}'`)],
  'gen-supabase-types com outro host': ['scripts/gen-supabase-types.mjs', (t) => t.replaceAll(canonical, OUTRO)],
};

function rodarEmCopia(t, arquivo, alterar) {
  const dir = mkdtempSync(join(tmpdir(), 'singu ref ç-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const rel of ARQUIVOS) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    cpSync(join(real, rel), join(dir, rel));
  }
  if (arquivo) writeFileSync(join(dir, arquivo), alterar(readFileSync(join(dir, arquivo), 'utf8')));
  // Sem NODE_TEST_CONTEXT: herdado do `node --test` de fora, ele faria o filho não rodar teste nenhum e sair 0.
  const env = { ...process.env, SINGU_REPO_ROOT: dir };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['--test', fileURLToPath(import.meta.url)], { encoding: 'utf8', env });
}

// Só no processo principal: a cópia roda este mesmo arquivo com SINGU_REPO_ROOT e não repete esta parte.
if (!process.env.SINGU_REPO_ROOT) {
  test('uma cópia fiel do repositório passa', (t) => {
    const r = rodarEmCopia(t);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /# pass 6\n# fail 0/, 'os 6 testes rodaram de verdade na cópia');
  });
  for (const [nome, [arquivo, alterar]] of Object.entries(DIVERGENCIAS)) {
    test(`reprova: ${nome}`, (t) => {
      const r = rodarEmCopia(t, arquivo, alterar);
      assert.equal(r.status, 1, `a divergência passou despercebida:\n${r.stdout}`);
      assert.match(r.stdout, /# fail [1-9]/);
    });
  }
}
