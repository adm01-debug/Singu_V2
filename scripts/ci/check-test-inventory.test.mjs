import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  ALLOWLIST_DENO,
  ALLOWLIST_NODE,
  RAIZ,
  casaPadrao,
  orfaosNode,
  padroesDeWorkflow,
  suitesCobertasPorImport,
  padroesDosWorkflows,
  suitesNodeOrfas,
  testesDenoOrfaos,
} from './check-test-inventory.mjs';

// Workflow sintetico com as tres formas de bloco `run:` do repositorio: escalar dobrado
// (`>-`), literal (`|`) e de uma linha. Os caminhos fora de `run:` (nome da etapa, comentario
// solto) NAO podem contar como cobertura: senao um comentario bastaria para esconder a suite.
const WORKFLOW = [
  'name: ci',
  'jobs:',
  '  guards:',
  '    steps:',
  '      # scripts/docs/comentado.test.mjs aparece em comentario, nao roda',
  '      - name: roda as suites de scripts/ci (scripts/docs/mencionada-no-nome.test.mjs)',
  '        run: >-',
  '          node --test scripts/ci/*.test.mjs scripts/lib/*.test.mjs',
  '          scripts/inventario/gerar-rotas.test.mjs',
  '      - name: roda um script de teste direto',
  '        run: node scripts/docs/verificar.integration.mjs',
  '      - name: bloco literal',
  '        run: |',
  '          node --test scripts/inventario/*.unit.mjs',
  '          # node --test scripts/docs/desligado-por-comentario.test.mjs',
  '    outro-job:',
  '      steps: []',
].join('\n');

test('padroesDeWorkflow le os blocos run (dobrado, literal e de uma linha)', () => {
  assert.deepEqual(padroesDeWorkflow(WORKFLOW), [
    'scripts/ci/*.test.mjs',
    'scripts/docs/verificar.integration.mjs',
    'scripts/inventario/*.unit.mjs',
    'scripts/inventario/gerar-rotas.test.mjs',
    'scripts/lib/*.test.mjs',
  ]);
});

test('caminho citado fora de run (nome da etapa, comentario) nao cobre a suite', () => {
  const padroes = padroesDeWorkflow(WORKFLOW);
  assert.equal(padroes.some((p) => p.includes('mencionada-no-nome')), false);
  assert.equal(padroes.some((p) => p.includes('comentado')), false);
  assert.equal(padroes.some((p) => p.includes('desligado-por-comentario')), false, 'passo comentado dentro do run: nao executa');
});

test('casaPadrao trata * como um nivel de diretorio e ** como qualquer nivel', () => {
  assert.equal(casaPadrao('scripts/ci/actions-kpi.test.mjs', 'scripts/ci/*.test.mjs'), true);
  assert.equal(casaPadrao('scripts/docs/prova.test.mjs', 'scripts/ci/*.test.mjs'), false);
  assert.equal(casaPadrao('scripts/ci/sub/prova.test.mjs', 'scripts/ci/*.test.mjs'), false, '* nao atravessa /');
  assert.equal(casaPadrao('scripts/ci/sub/prova.test.mjs', 'scripts/ci/**/*.test.mjs'), true, '** atravessa /');
  assert.equal(
    casaPadrao('supabase/functions/_shared/auth_test.ts', 'supabase/functions/_shared/auth_test.ts'),
    true,
    'caminho exato casa',
  );
  assert.equal(casaPadrao('scripts/ci/actions-kpi.mjs', 'scripts/ci/*.test.mjs'), false, 'o glob pede .test.mjs');
});

test('suite Node fora dos blocos run vira orfa — e a allowlist a absolve', () => {
  const suites = [
    'scripts/ci/check-test-inventory.test.mjs',
    'scripts/docs/sem-passo-nenhum.test.mjs',
  ];
  const padroes = padroesDeWorkflow(WORKFLOW);
  assert.deepEqual(orfaosNode(suites, padroes, new Set()), ['scripts/docs/sem-passo-nenhum.test.mjs']);
  assert.deepEqual(
    orfaosNode(suites, padroes, new Set(['scripts/docs/sem-passo-nenhum.test.mjs'])),
    [],
  );
});

test('agregador coberto alcança imports estáticos, inclusive transitivos, mas não comentários', () => {
  const suites = [
    'scripts/ci/agregador.test.mjs',
    'scripts/docs/contraste.test.mjs',
    'scripts/lib/producao.test.mjs',
    'scripts/docs/orfao.test.mjs',
  ];
  const fontes = new Map([
    ['scripts/ci/agregador.test.mjs', "import '../docs/contraste.test.mjs';\n// import '../docs/orfao.test.mjs';\n"],
    ['scripts/docs/contraste.test.mjs', "import '../lib/producao.test.mjs';\n"],
    ['scripts/lib/producao.test.mjs', ''],
  ]);
  const cobertas = suitesCobertasPorImport(
    suites,
    ['scripts/ci/*.test.mjs'],
    (arquivo) => fontes.get(arquivo) ?? '',
  );
  assert.deepEqual([...cobertas].sort(), [
    'scripts/ci/agregador.test.mjs',
    'scripts/docs/contraste.test.mjs',
    'scripts/lib/producao.test.mjs',
  ]);
  assert.equal(cobertas.has('scripts/docs/orfao.test.mjs'), false);
});

test('a arvore atual nao tem suite Node fora dos workflows nem da ALLOWLIST_NODE', () => {
  // Toda suite Node de scripts/ passa por aqui: ou um bloco `run:` a executa, ou ela esta
  // nomeada na ALLOWLIST_NODE. Sem isso, uma suite nova nasce sem passo nenhum e o
  // inventario continua dizendo OK — foi o defeito desta tarefa.
  assert.deepEqual(suitesNodeOrfas(), []);
});

test('a ALLOWLIST_NODE nao guarda entrada morta', () => {
  for (const arquivo of ALLOWLIST_NODE) {
    assert.ok(existsSync(join(RAIZ, arquivo)), `${arquivo} esta na ALLOWLIST_NODE mas nao existe no repositorio`);
  }
});

test('importar o verificador nao roda o inventario (o teste importa as funcoes)', () => {
  // Sem a guarda de modulo principal, o import roda a checagem e chama process.exit -- foi
  // o que fez este arquivo "passar" sem executar nenhuma assercao na primeira tentativa.
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./scripts/ci/check-test-inventory.mjs');"], {
    cwd: RAIZ,
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '', 'importar nao pode imprimir o relatorio do inventario');
});

test('a árvore atual não tem teste Deno fora dos workflows nem da ALLOWLIST_DENO', () => {
  // Mesma regra dos testes Node, para `supabase/functions/**/*_test.ts`: ou um bloco
  // `run:` o executa, ou ele está nomeado na allowlist herdada. Teste Deno novo fora de
  // workflow reprova aqui — foi exatamente o buraco que deixou 15 suítes sem rodar.
  assert.deepEqual(testesDenoOrfaos(), []);
});

test('a ALLOWLIST_DENO não guarda entrada morta', () => {
  for (const arquivo of ALLOWLIST_DENO) {
    assert.ok(existsSync(join(RAIZ, arquivo)), `${arquivo} está na ALLOWLIST_DENO mas não existe no repositório`);
  }
});

test('a ALLOWLIST_DENO só encurta: nenhum teste nela é executado por workflow', () => {
  // Se um teste da allowlist entrou num passo `run:`, ele tem de SAIR da lista — senão a
  // lista cresce em silêncio e deixa de medir a dívida que ela existe para registrar.
  const padroes = padroesDosWorkflows(/supabase\/functions\/[A-Za-z0-9_./*-]+_test\.ts/g);
  for (const arquivo of ALLOWLIST_DENO) {
    assert.equal(
      padroes.some((padrao) => casaPadrao(arquivo, padrao)),
      false,
      `${arquivo} já roda em algum workflow: remova-o da ALLOWLIST_DENO`,
    );
  }
});
