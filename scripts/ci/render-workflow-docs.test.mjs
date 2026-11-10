// Testes de scripts/ci/render-workflow-docs.mjs sobre workflows sinteticos em diretorio temporario.
// Rodar: node --test scripts/ci/render-workflow-docs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { extrairDocs, extrairNaoEBug, nomeDe, desencapar, lerWorkflows, renderizar } from './render-workflow-docs.mjs';

function repoFalso(arquivos) {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'wf-docs-'));
  const dir = path.join(raiz, '.github/workflows');
  fs.mkdirSync(dir, { recursive: true });
  for (const [nome, texto] of Object.entries(arquivos)) fs.writeFileSync(path.join(dir, nome), texto);
  return raiz;
}

const COMPLETO = `# docs:
#   gatilho: push em main
#   prova: o build sai verde
#   falha: PR vermelha
#   avisa: ninguem
# nao-e-bug:
#   - cache-frio: "primeira rodada" leva 6 min, as seguintes 2
name: Build
on: push
`;

test('extrairDocs le os quatro campos e para na primeira linha que nao e comentario', () => {
  assert.deepEqual(extrairDocs(COMPLETO), {
    gatilho: 'push em main', prova: 'o build sai verde', falha: 'PR vermelha', avisa: 'ninguem',
  });
  assert.equal(extrairDocs('name: Sem bloco\non: push\n'), null);
});

test('extrairNaoEBug preserva aspas no meio da descricao', () => {
  assert.deepEqual(extrairNaoEBug(COMPLETO), [
    { chave: 'cache-frio', descricao: '"primeira rodada" leva 6 min, as seguintes 2' },
  ]);
});

test('desencapar tira so o par de aspas que envolve todo o texto', () => {
  assert.equal(desencapar('"tudo entre aspas"'), 'tudo entre aspas');
  assert.equal(desencapar('"meio" com aspas'), '"meio" com aspas');
  assert.equal(desencapar('sem aspas'), 'sem aspas');
});

test('nomeDe usa o name: do YAML e cai no nome do arquivo quando nao tem', () => {
  assert.equal(nomeDe(COMPLETO, 'build.yml'), 'Build');
  assert.equal(nomeDe('on: push\n', 'sem-nome.yml'), 'sem-nome');
});

test('bloco pela metade derruba a geracao, nomeando o campo que falta', () => {
  const raiz = repoFalso({ 'meio.yml': '# docs:\n#   gatilho: push\n#   prova: algo\nname: Meio\n' });
  assert.throws(() => lerWorkflows(raiz), /meio\.yml.*falha, avisa/s);
});

test('workflow sem bloco nao derruba: entra na secao de lacuna declarada', () => {
  const raiz = repoFalso({ 'build.yml': COMPLETO, 'cru.yml': 'name: Cru\non: push\n' });
  const { documentados, semBloco } = lerWorkflows(raiz);
  assert.deepEqual(documentados.map((d) => d.arquivo), ['build.yml']);
  assert.deepEqual(semBloco, [{ arquivo: 'cru.yml', nome: 'Cru' }]);

  const md = renderizar(raiz);
  assert.match(md, /\*\*2 workflows, 1 com bloco/);
  assert.match(md, /## Sem bloco `# docs:`/);
  assert.match(md, /- \[`cru\.yml`\]\(\.\.\/\.\.\/\.github\/workflows\/cru\.yml\) — Cru/);
  assert.match(md, /## O que NÃO é bug/);
  assert.match(md, /\| — \| — \|/, 'sem docs\\/ci\\/kpi.json as colunas de KPI saem como travessao');
});

test('o KPI entra nas colunas quando docs/ci/kpi.json existe', () => {
  const raiz = repoFalso({ 'build.yml': COMPLETO });
  fs.mkdirSync(path.join(raiz, 'docs/ci'), { recursive: true });
  fs.writeFileSync(path.join(raiz, 'docs/ci/kpi.json'), JSON.stringify({ 'build.yml': { custo_semana_min: 42, taxa_falha_7d: '3%' } }));
  assert.match(renderizar(raiz), /\| 42 \| 3% \|/);
});

test('a saida e deterministica e nao depende da ordem de leitura do diretorio', () => {
  const raiz = repoFalso({ 'zz.yml': COMPLETO.replace('name: Build', 'name: Zebra'), 'aa.yml': COMPLETO });
  const md = renderizar(raiz);
  assert.equal(md, renderizar(raiz));
  assert.ok(md.indexOf('### Build (`aa.yml`)') < md.indexOf('### Zebra (`zz.yml`)'), 'ordem alfabetica por arquivo');
});

test('sem secao de nao-e-bug quando nenhum workflow declara', () => {
  const raiz = repoFalso({ 'build.yml': COMPLETO.split('# nao-e-bug:')[0] + 'name: Build\non: push\n' });
  assert.ok(!renderizar(raiz).includes('## O que NÃO é bug'));
});
