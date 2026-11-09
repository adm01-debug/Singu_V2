// Garante que o projeto Supabase canônico é um só em todo o repositório.
// Fonte da verdade: a linha "Supabase canônico: `<ref>`" do AGENTS.md. Devem apontar para o mesmo ref:
// supabase/config.toml (project_id), supabase/.temp/linked-project.json (ref) e a CSP do vite.config.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
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
