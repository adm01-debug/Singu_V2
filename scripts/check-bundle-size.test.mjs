// Testes do gate de tamanho do bundle (scripts/check-bundle-size.mjs) contra builds de mentira em tmp.
// Rodar: node --test scripts/check-bundle-size.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-bundle-size.mjs');
// Bytes aleatórios não comprimem: N KB no disco ≈ N KB gzip. Gerado uma vez e fatiado.
const RUIDO = randomBytes(520 * 1024);
const kb = (n) => RUIDO.subarray(0, n * 1024);
const INDEX = (src) => `<!doctype html><html><head><script type="module" crossorigin src="${src}"></script></head></html>`;

/** Monta <tmp>/dist com os arquivos dados e roda o script. `modo`: 'cwd' (padrão do CI), 'flag' ou 'env'. */
function rodar(t, arquivos, { modo = 'cwd', env = {}, args = [], pasta = 'dist' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'bundle size ç-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    const p = join(dir, pasta, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, conteudo);
  }
  const base = { ...process.env };
  delete base.CI;
  delete base.BUNDLE_DIST_DIR;
  const res = spawnSync(process.execPath, [SCRIPT, ...(modo === 'flag' ? ['--dist', join(dir, pasta)] : []), ...args], {
    cwd: modo === 'cwd' ? dir : tmpdir(),
    encoding: 'utf8',
    env: { ...base, ...(modo === 'env' ? { BUNDLE_DIST_DIR: join(dir, pasta) } : {}), ...env },
  });
  return { code: res.status, out: res.stdout, err: res.stderr };
}

test('aprova build dentro do budget e marca o entry do index.html', (t) => {
  const r = rodar(t, { 'index.html': INDEX('/assets/js/index-abc.js'), 'assets/js/index-abc.js': kb(300), 'assets/js/vendor-x.js': kb(450) });
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /index-abc\.js\s+300\.\d KB \[ENTRY\]/);
  assert.doesNotMatch(r.out, /vendor-x\.js.*\[ENTRY\]/);
  assert.match(r.out, /Total JS gzipped: 75\d\.\d KB/);
  assert.match(r.out, /✅ Todos os chunks dentro do budget/);
});

test('falha quando o entry passa de 350 KB gzip', (t) => {
  const r = rodar(t, { 'index.html': INDEX('/assets/js/index-abc.js'), 'assets/js/index-abc.js': kb(360) });
  assert.equal(r.code, 1);
  assert.match(r.err, /index-abc\.js = 36\d\.\d KB gzip \(limite 350 KB, entry\)/);
  assert.doesNotMatch(r.out, /✅/);
});

test('falha quando um chunk comum passa de 500 KB gzip', (t) => {
  const r = rodar(t, { 'index.html': INDEX('/assets/js/index-abc.js'), 'assets/js/index-abc.js': kb(10), 'assets/js/pesado-1.js': kb(510) });
  assert.equal(r.code, 1);
  assert.match(r.err, /pesado-1\.js = 51\d\.\d KB gzip \(limite 500 KB\)/);
});

test('entry com nome fora do padrão (app-*.js) recebe o limite de entry', (t) => {
  // Antes: só `index-`/`main-` contavam como entry; um entry renomeado ganhava o limite de 500 KB.
  const r = rodar(t, { 'index.html': INDEX('/assets/js/app-abc.js'), 'assets/js/app-abc.js': kb(400) });
  assert.equal(r.code, 1);
  assert.match(r.err, /app-abc\.js.*entry/);
});

test('chunk lazy chamado index-*.js não é tratado como entry', (t) => {
  // O Vite chama de index-<hash>.js todo chunk vindo de um arquivo index.ts(x).
  const r = rodar(t, {
    'index.html': INDEX('/assets/js/index-abc.js'),
    'assets/js/index-abc.js': kb(100),
    'assets/js/index-lazy.js': kb(400),
  });
  assert.equal(r.code, 0, r.err);
});

test('sem index.html, vale o nome: index-* e main-* são entry', (t) => {
  for (const nome of ['index-abc.js', 'main-abc.js']) {
    const r = rodar(t, { [`assets/${nome}`]: kb(360) });
    assert.equal(r.code, 1, nome);
    assert.match(r.err, /limite 350 KB/);
  }
});

test('index.html com aspas simples, query string e script não-módulo', (t) => {
  const html = "<script src='/registerSW.js'></script><script src='/assets/app-x.js?v=1' type='module'></script>";
  const r = rodar(t, { 'index.html': html, 'assets/app-x.js': kb(360), 'assets/registerSW.js': kb(1) });
  assert.equal(r.code, 1);
  assert.match(r.err, /app-x\.js.*entry/);
});

test('entry do index.html fora de assets/ falha em vez de ficar sem budget', (t) => {
  const r = rodar(t, { 'index.html': INDEX('/app-abc.js'), 'app-abc.js': kb(400), 'assets/vendor.js': kb(10) });
  assert.equal(r.code, 1);
  assert.match(r.err, /entry do index\.html \(app-abc\.js\) não está em/);
});

test('ignora o que não é .js (css, mapa de fonte) e mede .mjs', (t) => {
  const r = rodar(t, { 'assets/a.css': kb(510), 'assets/a.js.map': kb(510), 'assets/ok.js': kb(1), 'assets/grande.mjs': kb(510) });
  assert.equal(r.code, 1);
  assert.match(r.err, /grande\.mjs/);
  assert.doesNotMatch(r.err, /a\.css|a\.js\.map/);
});

test('build sem nenhum .js falha', (t) => {
  const r = rodar(t, { 'assets/a.css': 'body{}' });
  assert.equal(r.code, 1);
  assert.match(r.err, /Nenhum bundle JavaScript/);
});

test('build ausente: avisa e sai 0 fora do CI; falha no CI e com --strict', (t) => {
  const local = rodar(t, {});
  assert.equal(local.code, 0);
  assert.match(local.err, /não encontrado — pule/);
  for (const opcoes of [{ env: { CI: 'true' } }, { args: ['--strict'] }, { env: { CI: '1' } }]) {
    const r = rodar(t, {}, opcoes);
    assert.equal(r.code, 1, JSON.stringify(opcoes));
    assert.match(r.err, /nada foi medido/);
  }
  assert.equal(rodar(t, {}, { env: { CI: 'false' } }).code, 0);
  assert.equal(rodar(t, {}, { env: { CI: '' } }).code, 0);
});

test('assets que é arquivo (não pasta) conta como build ausente', (t) => {
  const r = rodar(t, { assets: 'x' }, { env: { CI: 'true' } });
  assert.equal(r.code, 1);
});

test('--dist e BUNDLE_DIST_DIR apontam outra pasta (com espaço e acento), de qualquer cwd', (t) => {
  for (const modo of ['flag', 'env']) {
    const ok = rodar(t, { 'assets/index-a.js': kb(10) }, { modo, pasta: 'saída build' });
    assert.equal(ok.code, 0, ok.err);
    const ruim = rodar(t, { 'assets/index-a.js': kb(360) }, { modo, pasta: 'saída build' });
    assert.equal(ruim.code, 1);
  }
});

test('--dist sem valor sai com 2; --help sai com 0', (t) => {
  assert.equal(rodar(t, {}, { args: ['--dist'] }).code, 2);
  const ajuda = rodar(t, {}, { args: ['--help'] });
  assert.equal(ajuda.code, 0);
  assert.match(ajuda.out, /Uso:/);
});

test('saída determinística: mesma entrada, mesmo relatório', (t) => {
  const arquivos = { 'assets/b.js': kb(20), 'assets/a.js': kb(20), 'assets/c.js': kb(5) };
  const a = rodar(t, arquivos);
  const b = rodar(t, arquivos);
  const semPasta = (s) => s.replace(/^.*(?=dist)/gm, '');
  assert.equal(semPasta(a.out), semPasta(b.out));
  assert.ok(a.out.indexOf('a.js') < a.out.indexOf('b.js'), 'empate ordena por nome');
});

test('lista só os 10 maiores, mas soma todos no total', (t) => {
  const arquivos = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`assets/c${String(i).padStart(2, '0')}.js`, kb(i + 1)]));
  const r = rodar(t, arquivos);
  assert.equal(r.code, 0, r.err);
  assert.equal((r.out.match(/ KB$/gm) ?? []).length, 11); // 10 chunks + linha do total
  assert.doesNotMatch(r.out, /c00\.js|c01\.js/);
  assert.match(r.out, /Total JS gzipped: 7[89]\.\d KB/);
});
