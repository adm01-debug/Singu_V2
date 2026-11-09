// Testes do ratchet do linter do backend (scripts/check-backend-linter-baseline.mjs).
// Rodar: node --test scripts/check-backend-linter-baseline.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SCRIPT = join(REPO, 'scripts/check-backend-linter-baseline.mjs');
const DOC = readFileSync(join(REPO, '.lovable/memory/architecture/security/linter-baseline.md'), 'utf8');
// Teto documentado: "Baseline atual: **12 WARN**".
const TETO = Number(/Baseline atual:\s*\*\*(\d+) WARN\*\*/.exec(DOC)?.[1]);

const rodar = (input, args = []) => {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { input, encoding: 'utf8', cwd: tmpdir() });
  return { code: res.status, out: res.stdout, err: res.stderr };
};

test('o teto do script é o documentado em linter-baseline.md', () => {
  assert.ok(Number.isInteger(TETO), 'linter-baseline.md precisa de "Baseline atual: **N WARN**"');
  assert.equal(rodar(`Found ${TETO} linter issues`).code, 0);
  assert.equal(rodar(`Found ${TETO + 1} linter issues`).code, 1);
  assert.match(DOC, new RegExp(`BASELINE = ${TETO}\\b`));
});

test('no teto: aprova e mostra a comparação', () => {
  const r = rodar(`Found ${TETO} linter issues\n`);
  assert.equal(r.code, 0);
  assert.match(r.out, new RegExp(`${TETO} ≤ ${TETO}`));
  assert.doesNotMatch(r.out, /reduza BASELINE/);
});

test('acima do teto: exit 1 com a contagem no stderr', () => {
  const r = rodar(`linha qualquer\nFound ${TETO + 5} linter issues in the database\n`);
  assert.equal(r.code, 1);
  assert.match(r.err, new RegExp(`Drift positivo: ${TETO + 5} WARN \\(baseline ${TETO}\\)`));
  assert.equal(r.out, '');
});

test('abaixo do teto: aprova e avisa para apertar o ratchet', () => {
  const r = rodar('Found 3 linter issues');
  assert.equal(r.code, 0);
  assert.match(r.out, /reduza BASELINE para 3/);
});

test('singular, caixa alta e espaços variados são aceitos', () => {
  assert.equal(rodar('found 1 linter issue').code, 0);
  assert.equal(rodar('FOUND   2\tLINTER ISSUES').code, 0);
  assert.equal(rodar('Found 999 linter issue').code, 1);
});

test('"No linter issues found" vale zero', () => {
  const r = rodar('No linter issues found\n');
  assert.equal(r.code, 0);
  assert.match(r.out, /0 ≤/);
});

test('várias contagens no mesmo texto: vale a maior', () => {
  // Antes valia a primeira: dava para esconder um drift colando uma saída limpa na frente.
  assert.equal(rodar(`Found 1 linter issues\nFound ${TETO + 1} linter issues\n`).code, 1);
  assert.equal(rodar(`No linter issues found\nFound ${TETO + 1} linter issues\n`).code, 1);
  assert.equal(rodar('Found 2 linter issues\nFound 1 linter issues\n').code, 0);
});

test('entrada vazia: informa e sai 0; com --strict sai 2', () => {
  for (const vazio of ['', '   \n\t\n']) {
    const r = rodar(vazio);
    assert.equal(r.code, 0);
    assert.match(r.out, /sem input em stdin/);
    const s = rodar(vazio, ['--strict']);
    assert.equal(s.code, 2);
    assert.match(s.err, /o linter não rodou/);
  }
});

test('formato desconhecido sai 2 (nunca aprova o que não entendeu)', () => {
  for (const texto of ['erro: connection refused', 'Found many linter issues', 'Found -3 linter issues', '{"lints":[]}', 'Found 12 issues']) {
    const r = rodar(texto);
    assert.equal(r.code, 2, texto);
    assert.match(r.err, /formato não reconhecido/);
  }
});

test('stdin fechado ou /dev/null não derruba o script', () => {
  const fechado = spawnSync('bash', ['-c', `"${process.execPath}" "${SCRIPT}" <&-`], { encoding: 'utf8' });
  assert.equal(fechado.status, 0, fechado.stderr);
  const nulo = spawnSync(process.execPath, [SCRIPT], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  assert.equal(nulo.status, 0, nulo.stderr);
});

test('entrada grande (5 MB) com a contagem no fim', () => {
  const r = rodar(`${'ruido de log\n'.repeat(400000)}Found ${TETO + 1} linter issues\n`);
  assert.equal(r.code, 1);
});

test('pipe lento (quem escreve demora) não vira EAGAIN nem "sem input"', () => {
  // Antes: readFileSync(0) num pipe ainda vazio estourava EAGAIN e o script caía com entrada válida.
  const cmd = `(sleep 0.3; echo "Found ${TETO + 1} linter issues") | "${process.execPath}" "${SCRIPT}"`;
  const r = spawnSync('bash', ['-c', cmd], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /Drift positivo/);
});

test('--help sai 0 sem ler stdin', () => {
  const r = rodar('Found 999 linter issues', ['--help']);
  assert.equal(r.code, 0);
  assert.match(r.out, /Uso:/);
});
