import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'singu-gates-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function runRls(t, scenario, update = false) {
  const dir = fixture(t);
  const script = join(dir, 'check-rls-baseline.mjs');
  const baseline = join(dir, 'rls-baseline.json');
  cpSync(join(root, 'scripts/rls-matrix/check-rls-baseline.mjs'), script);
  const original = JSON.stringify({ _meta: { gerado_em: '2026-01-01' }, tabelas: {
    contacts: { anon: 0, authenticated_sem_role: 0 },
    companies: { anon: 0, authenticated_sem_role: 0 },
  } });
  writeFileSync(baseline, original);
  const loader = join(dir, 'fetch.mjs');
  writeFileSync(loader, `
    globalThis.fetch = async (url, options) => {
      const scenario = process.env.SCENARIO;
      const authenticated = options.headers.Authorization === 'Bearer fixture-user';
      const affected = url.includes('/contacts?') && authenticated;
      if (affected && scenario === 'rede') throw new Error('conexao interrompida');
      if (affected && scenario === '500') return new Response('{}', { status: 500 });
      if (affected && scenario === 'json') return new Response('invalido');
      if (affected && scenario === 'objeto') return new Response('{}');
      if (affected && scenario === 'jwt') return Response.json({ code: 'PGRST303' }, { status: 401 });
      if (affected && scenario === 'negado') return Response.json({ code: '42501' }, { status: 403 });
      if (affected && scenario === 'regressao') return Response.json([{ id: 'alheio' }]);
      return Response.json([]);
    };
  `);
  const result = spawnSync(process.execPath, ['--import', loader, script, ...(update ? ['--update'] : [])], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, SCENARIO: scenario, SUPABASE_URL: 'https://fixture.invalid',
      SUPABASE_ANON_KEY: 'fixture-anon', TEST_USER_JWT: 'fixture-user' },
  });
  assert.ifError(result.error);
  return { ...result, original, baseline: readFileSync(baseline, 'utf8') };
}

for (const scenario of ['rede', '500', 'json', 'objeto', 'jwt']) {
  for (const update of [false, true]) {
    test(`RLS falha com ${scenario}, preservando baseline${update ? ' mesmo com --update' : ''}`, t => {
      const result = runRls(t, scenario, update);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /VERIFICACAO INCOMPLETA/);
      assert.doesNotMatch(result.stdout, /nenhuma regressao|baseline atualizado/);
      assert.equal(result.baseline, result.original);
    });
  }
}

test('RLS aprova coleta completa e distingue negação SQL de JWT inválido', t => {
  for (const scenario of ['ok', 'negado']) {
    const result = runRls(t, scenario);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /2 tabelas, 2 perfil\(is\), nenhuma regressao/);
  }
});

test('RLS continua detectando aumento de exposição', t => {
  const result = runRls(t, 'regressao');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /REGRESSAO DE EXPOSICAO/);
});

test('RLS permite atualizar baseline somente após coleta completa', t => {
  const result = runRls(t, 'negado', true);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.baseline).tabelas.contacts.authenticated_sem_role, -1);
});

const slugs = ['health', 'system-health', 'voice-ai-health', 'email-pipeline-health'];

function runDeploy(t, options = {}) {
  const dir = fixture(t);
  const scripts = join(dir, 'scripts/migration/functions');
  const bin = join(dir, 'bin');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(bin);
  for (const slug of slugs) mkdirSync(join(dir, 'supabase/functions', slug), { recursive: true });
  const script = join(scripts, 'verify-deploy.sh');
  cpSync(join(root, 'scripts/migration/functions/verify-deploy.sh'), script);
  writeFileSync(join(bin, 'supabase'), `#!/usr/bin/env node
    if (!process.argv.includes('--output') || !process.argv.includes('json')) process.exit(2);
    process.stdout.write(process.env.REMOTE_INVENTORY);
    process.exit(Number(process.env.CLI_EXIT));
  `, { mode: 0o755 });
  writeFileSync(join(bin, 'curl'), `#!/usr/bin/env node
    const { writeFileSync } = require('node:fs');
    if (process.argv.includes('-I')) process.exit(2);
    const timeout = Number(process.argv[process.argv.indexOf('--max-time') + 1]);
    if (timeout !== 75) process.exit(2);
    if (Number(process.env.LATENCY_SECONDS || 0) >= timeout) process.exit(28);
    writeFileSync(process.argv[process.argv.indexOf('-o') + 1], process.env.MOCK_HEALTH_BODY);
    process.stdout.write(process.env.HTTP_CODE);
    process.exit(Number(process.env.CURL_EXIT));
  `, { mode: 0o755 });
  const result = spawnSync('bash', [script, '--project-ref', 'fixture'], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CLI_EXIT: '0', CURL_EXIT: '0',
      REMOTE_INVENTORY: JSON.stringify(slugs.map(slug => ({ slug, status: 'ACTIVE' }))),
      HTTP_CODE: '200', MOCK_HEALTH_BODY: '{"status":"healthy"}', ...options },
  });
  assert.ifError(result.error);
  return result;
}

const deployFailures = [
  ['falha da CLI', { CLI_EXIT: '1' }],
  ['inventário vazio', { REMOTE_INVENTORY: '' }],
  ['JSON inválido', { REMOTE_INVENTORY: 'invalido' }],
  ['lista vazia', { REMOTE_INVENTORY: '[]' }],
  ['formato incorreto', { REMOTE_INVENTORY: '[{}]' }],
  ['função ausente', { REMOTE_INVENTORY: '[{"slug":"health","status":"ACTIVE"}]' }],
  ['função inativa', { REMOTE_INVENTORY: JSON.stringify(slugs.map(slug => ({ slug, status: 'REMOVED' }))) }],
  ['rede indisponível', { CURL_EXIT: '7', HTTP_CODE: '000' }],
  ...['401', '403', '404', '500', '503'].map(HTTP_CODE => [`HTTP ${HTTP_CODE}`, { HTTP_CODE }]),
  ['corpo inválido com HTTP 200', { MOCK_HEALTH_BODY: '<html>erro</html>' }],
  ['resposta sem estado com HTTP 200', { MOCK_HEALTH_BODY: '{}' }],
  ['serviço degradado com HTTP 200', { MOCK_HEALTH_BODY: '{"status":"degraded"}' }],
];

for (const [name, options] of deployFailures) {
  test(`Publicação falha com ${name}`, t => {
    const result = runDeploy(t, options);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /ERRO:/);
    assert.doesNotMatch(result.stdout, /^OK -/m);
  });
}

test('Publicação aprova inventário ativo e quatro respostas healthy', t => {
  const result = runDeploy(t);
  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stdout.match(/HTTP 200, healthy/g) ?? []).length, 4);
  assert.match(result.stdout, /^OK - inventário ativo/m);
});

for (const seconds of [18, 74]) {
  test(`Publicação aceita healthy com latência simulada de ${seconds}s`, t => {
    const result = runDeploy(t, { LATENCY_SECONDS: String(seconds) });
    assert.equal(result.status, 0, result.stderr);
    assert.equal((result.stdout.match(/HTTP 200, healthy/g) ?? []).length, 4);
  });
}

test('Publicação falha quando o curl excede o limite finito de 75s', t => {
  const result = runDeploy(t, { LATENCY_SECONDS: '76' });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /não consegui consultar email-pipeline-health/);
  assert.doesNotMatch(result.stdout, /^OK -/m);
});
