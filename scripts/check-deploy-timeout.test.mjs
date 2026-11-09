import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const slugs = ['health', 'system-health', 'voice-ai-health', 'email-pipeline-health'];
// VERIFY_DEPLOY_SCRIPT só existe para provar que este teste reprova uma cópia adulterada do script.
const ORIGEM = process.env.VERIFY_DEPLOY_SCRIPT || join(root, 'scripts/migration/functions/verify-deploy.sh');

// Prova, com o curl de verdade, que o prazo de 75 s do verify-deploy.sh é respeitado e que não há
// retry escondido somando espera. Por padrão o relógio roda em escala 1:10: o curl de teste confere
// que o script pediu exatamente `--max-time 75`, troca por 7.5 e o servidor local atrasa 1/10 do
// tempo. Esperar 76 s de relógio não provava nada a mais sobre o script (só sobre o curl) e custava
// 75 s em todo CI. A fronteira exata 74 s/76 s continua coberta, simulada, em
// check-publish-gates.test.mjs; aqui as respostas ficam a 0,5 s do limite para não oscilar em
// máquina carregada. Para a prova em tempo real (18/74/76 s): DEPLOY_TIMEOUT_TEMPO_REAL=1.
const TEMPO_REAL = process.env.DEPLOY_TIMEOUT_TEMPO_REAL === '1';
const ESCALA = TEMPO_REAL ? 1 : 10;
const CASOS = TEMPO_REAL ? [18, 74, 76] : [18, 70, 80];
const LIMITE = 75; // HEALTH_TIMEOUT_SECONDS do verify-deploy.sh
// Folga para o custo fixo do script (CLI falsa, 4 curls, 4 validações). Um retry somaria LIMITE/ESCALA inteiro.
const TETO = LIMITE / ESCALA + (TEMPO_REAL ? 15 : 5);

// Curl real, somente loopback; provas independentes executadas em paralelo.
describe('Prazo real dos health checks', { concurrency: true }, () => {
for (const seconds of CASOS) {
  test(`Publicação com curl real e resposta local em ${seconds}s${TEMPO_REAL ? '' : ' (escala 1:10)'}`, {
    timeout: 95000,
  }, async t => {
    const dir = mkdtempSync(join(tmpdir(), 'singu-deploy-timeout-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const server = createServer((req, res) => {
      assert.equal(req.method, 'GET');
      assert.equal(req.headers.authorization, 'Bearer fixture-user');
      assert.equal(req.headers.apikey, 'fixture-anon');
      const delay = req.url.endsWith('/email-pipeline-health') ? (seconds * 1000) / ESCALA : 0;
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
    cpSync(ORIGEM, script);
    writeFileSync(join(bin, 'supabase'), `#!/usr/bin/env node
      process.stdout.write(${JSON.stringify(JSON.stringify(slugs.map(slug => ({ slug, status: 'ACTIVE' }))))});
    `, { mode: 0o755 });
    writeFileSync(join(bin, 'curl'), `#!/usr/bin/env node
      const { spawnSync } = require('node:child_process');
      const { existsSync } = require('node:fs');
      const args = process.argv.slice(2).map(arg => arg.replace(
        'https://fixture.supabase.co/functions/v1', 'http://127.0.0.1:${port}'));
      // O script tem de pedir exatamente o prazo combinado; só então o relógio é reduzido pela escala.
      const i = args.indexOf('--max-time');
      if (i === -1 || args[i + 1] !== '${LIMITE}') {
        console.error('curl de teste: esperado --max-time ${LIMITE}, veio ' + (i === -1 ? 'nada' : args[i + 1]));
        process.exit(2);
      }
      args[i + 1] = String(${LIMITE} / ${ESCALA});
      const curlBin = existsSync('/usr/bin/curl') ? '/usr/bin/curl' : 'curl';
      const result = spawnSync(curlBin, args, { stdio: 'inherit' });
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
    if (seconds < LIMITE) {
      assert.equal(status, 0, stdout + stderr);
      assert.equal((stdout.match(/HTTP 200, healthy/g) ?? []).length, 4);
      assert.ok(elapsed >= seconds / ESCALA && elapsed < TETO, `Duração: ${elapsed}s`);
    } else {
      assert.equal(status, 1, stdout + stderr);
      assert.match(stderr, /curl: \(28\)/);
      assert.match(stderr, /não consegui consultar email-pipeline-health/);
      assert.doesNotMatch(stdout, /^OK -/m);
      assert.ok(elapsed >= LIMITE / ESCALA && elapsed < TETO, `Duração: ${elapsed}s`);
    }
  });
}
});
