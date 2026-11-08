// Testes do verificador de invariantes do ci.yml (scripts/ci/workflow-invariants.mjs).
//
// O script lê `.github/workflows/ci.yml` relativo ao cwd, então cada caso monta um
// repositório falso em diretório temporário com um ci.yml sintético e confere o veredito.
// O último caso roda contra o ci.yml REAL: o guarda tem de passar no estado atual, senão
// ele nasce vermelho e ninguém olha.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const SCRIPT = fileURLToPath(new URL('./workflow-invariants.mjs', import.meta.url));
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));

/** Roda o script num repositório falso com o `ci.yml` informado. */
function rodarCom(ci) {
  const base = mkdtempSync(join(tmpdir(), 'workflow-invariants-'));
  try {
    mkdirSync(join(base, '.github/workflows'), { recursive: true });
    writeFileSync(join(base, '.github/workflows/ci.yml'), ci, 'utf8');
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: base, encoding: 'utf8' });
    return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
}

const CI_OK = `name: CI
on: [push]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Cobertura
        run: npm run test:coverage
`;

test('passa quando test:coverage aparece uma vez e nenhum job usa always()', () => {
  const r = rodarCom(CI_OK);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /R3: test:coverage não duplicado/);
  assert.match(r.stdout, /R5: nenhum required-check usa always\(\)/);
});

test('R3: reprova test:coverage duplicado em dois passos', () => {
  const r = rodarCom(`${CI_OK}      - name: Cobertura de novo\n        run: npm run test:coverage\n`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /R3: 'npm run test:coverage' aparece 2 vezes/);
});

test('R5: reprova always() no nível do job de required check', () => {
  const r = rodarCom(`name: CI
on: [push]
jobs:
  build-and-test:
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:coverage
`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /R5: job 'build-and-test' em ci\.yml usa always\(\)/);
});

test('R5: reprova quando o required check desaparece do ci.yml', () => {
  const r = rodarCom(`name: CI
on: [push]
jobs:
  outro-nome:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:coverage
`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /R5: required-check 'build-and-test' não foi encontrado/);
});

test('W46: reprova upload do artefato dist sem if: guard', () => {
  const r = rodarCom(`${CI_OK}      - name: Subir dist
        uses: actions/upload-artifact@v7
        with:
          name: dist
          path: dist/
`);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /W46: upload-artifact para dist não tem `if:` guard/);
});

test('W46: aceita upload do artefato dist com if: guard', () => {
  const r = rodarCom(`${CI_OK}      - name: Subir dist
        uses: actions/upload-artifact@v7
        if: github.event_name == 'push'
        with:
          name: dist
          path: dist/
`);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /W46: dist artifact tem if: guard/);
});

test('o ci.yml real do repositório passa em todos os invariantes', () => {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: RAIZ, encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
});
