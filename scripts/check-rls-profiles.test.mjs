import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function run(t, { jwt = '', profiles = { anon: 0, authenticated_sem_role: 0 }, declared = {}, update = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'singu-rls-profiles-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const script = join(dir, 'check-rls-baseline.mjs');
  const baseline = join(dir, 'rls-baseline.json');
  const loader = join(dir, 'fetch.mjs');
  cpSync(join(root, 'scripts/rls-matrix/check-rls-baseline.mjs'), script);
  const original = JSON.stringify({ _meta: { gerado_em: '2026-01-01', perfis: declared }, tabelas: { contacts: profiles } });
  writeFileSync(baseline, original);
  writeFileSync(loader, `globalThis.fetch = async () => {
    console.log('COLETA_EXECUTADA');
    return Response.json([]);
  };`);
  const result = spawnSync(process.execPath, ['--import', loader, script, ...(update ? ['--update'] : [])], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, SUPABASE_URL: 'https://fixture.invalid', SUPABASE_ANON_KEY: 'fixture-anon', TEST_USER_JWT: jwt },
  });
  assert.ifError(result.error);
  return { ...result, original, baseline: readFileSync(baseline, 'utf8') };
}

for (const jwt of ['', '   ']) {
  for (const update of [false, true]) {
    test(`RLS rejeita JWT ${jwt ? 'em branco' : 'ausente'}${update ? ' com --update' : ''}`, t => {
      const result = run(t, { jwt, update });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /VERIFICACAO INCOMPLETA.*authenticated_sem_role/);
      assert.doesNotMatch(result.stdout, /COLETA_EXECUTADA|nenhuma regressao|baseline atualizado/);
      assert.equal(result.baseline, result.original);
    });
  }
}

test('RLS exige também os perfis declarados nos metadados', t => {
  const result = run(t, { profiles: { anon: 0 }, declared: { authenticated_sem_role: 'Usuário sem papel' } });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VERIFICACAO INCOMPLETA.*authenticated_sem_role/);
  assert.equal(result.baseline, result.original);
});

test('RLS não ignora perfil desconhecido no baseline', t => {
  const result = run(t, { jwt: 'fixture-user', profiles: { anon: 0, perfil_desconhecido: 0 }, update: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /VERIFICACAO INCOMPLETA.*perfil_desconhecido/);
  assert.equal(result.baseline, result.original);
});

test('RLS permite coleta anônima quando somente esse perfil é exigido', t => {
  const result = run(t, { profiles: { anon: 0 } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 tabelas, 1 perfil\(is\), nenhuma regressao/);
});

test('RLS aprova os dois perfis quando o JWT está disponível', t => {
  const result = run(t, { jwt: 'fixture-user' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 tabelas, 2 perfil\(is\), nenhuma regressao/);
});
