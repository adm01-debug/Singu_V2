import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const slugs = ['health', 'system-health', 'voice-ai-health', 'email-pipeline-health'];

// Prova lenta opcional: curl real, somente loopback, sem destino Supabase.
for (const seconds of [18, 74, 76]) {
  test(`Publicação com curl real e resposta local em ${seconds}s`, {
    skip: process.env.RUN_SLOW_DEPLOY_CHECKS !== '1', concurrency: true, timeout: 95000,
  }, async t => {
    const dir = mkdtempSync(join(tmpdir(), 'singu-deploy-timeout-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const server = createServer((req, res) => {
      assert.equal(req.method, 'GET');
      assert.equal(req.headers.authorization, 'Bearer fixture-user');
      assert.equal(req.headers.apikey, 'fixture-anon');
      const delay = req.url.endsWith('/email-pipeline-health') ? seconds * 1000 : 0;
      const timer = setTimeout(() => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"status":"healthy"}');
      }, delay);
      res.on('close', () => clearTimeout(timer));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => { server.closeAllConnections(); server.close(); });
    const port = server.address().port;
    const scripts = join(dir, 'scripts/migration/functions');
    const bin = join(dir, 'bin');
    mkdirSync(scripts, { recursive: true });
    mkdirSync(bin);
    for (const slug of slugs) mkdirSync(join(dir, 'supabase/functions', slug), { recursive: true });
    const script = join(scripts, 'verify-deploy.sh');
    cpSync(join(root, 'scripts/migration/functions/verify-deploy.sh'), script);
    writeFileSync(join(bin, 'supabase'), `#!/usr/bin/env node
      process.stdout.write(${JSON.stringify(JSON.stringify(slugs.map(slug => ({ slug, status: 'ACTIVE' }))))});
    `, { mode: 0o755 });
    writeFileSync(join(bin, 'curl'), `#!/usr/bin/env node
      const { spawnSync } = require('node:child_process');
      const args = process.argv.slice(2).map(arg => arg.replace(
        'https://fixture.supabase.co/functions/v1', 'http://127.0.0.1:${port}'));
      const result = spawnSync('/usr/bin/curl', args, { stdio: 'inherit' });
      if (result.error) throw result.error;
      process.exit(result.status ?? 1);
    `, { mode: 0o755 });
    const start = performance.now();
    const child = spawn('bash', [script, '--project-ref', 'fixture'], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`,
        HEALTH_JWT: 'fixture-user', SUPABASE_ANON_KEY: 'fixture-anon' },
    });
    t.after(() => { if (child.exitCode === null) child.kill(); });
    let stdout = '', stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    const status = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    });
    const elapsed = (performance.now() - start) / 1000;
    if (seconds < 75) {
      assert.equal(status, 0, stdout + stderr);
      assert.equal((stdout.match(/HTTP 200, healthy/g) ?? []).length, 4);
      assert.ok(elapsed >= seconds && elapsed < 90, `Duração: ${elapsed}s`);
    } else {
      assert.equal(status, 1, stdout + stderr);
      assert.match(stderr, /curl: \(28\)/);
      assert.match(stderr, /não consegui consultar email-pipeline-health/);
      assert.doesNotMatch(stdout, /^OK -/m);
      assert.ok(elapsed >= 75 && elapsed < 90, `Duração: ${elapsed}s`);
    }
  });
}
