// Testes de scripts/docs/verificar-citacoes.mjs sobre um repo sintetico em diretorio temporario.
// Rodar: node --test scripts/docs/verificar-citacoes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { extrairCitacoes, listarDocs, conferir, comparar, serializarBaseline } from './verificar-citacoes.mjs';

function repoFalso() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'cit-'));
  const escrever = (rel, texto) => {
    fs.mkdirSync(path.join(raiz, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), texto);
  };

  escrever('src/pages/Contatos.tsx', Array.from({ length: 10 }, (_, i) => `linha ${i + 1}`).join('\n'));
  escrever('supabase/functions/x/index.ts', 'uma linha\n');

  escrever('ESTADO.md', `A busca está em src/pages/Contatos.tsx:5 e o range src/pages/Contatos.tsx:2-8 também.
A linha src/pages/Contatos.tsx:999 não existe mais.
O arquivo src/pages/Sumiu.tsx:3 foi removido.
Sem linha: supabase/functions/x/index.ts
Isto não é citação: versao 2.1:30, nem outro.txt:4, nem lib/solta.ts:9.
`);
  escrever('docs/guia.md', 'Ver src/pages/Contatos.tsx:5 (repetido no outro doc, conta de novo aqui).\n');
  escrever('docs/contexto/gerado.md', 'Citação em pasta gerada: src/pages/NaoExiste.tsx:1\n');
  escrever('node_modules/pacote/README.md', 'Ignorar: src/pages/Fantasma.tsx:1\n');
  escrever('src/pages/README.md', 'Fora de docs/ e fora da raiz: src/pages/Fantasma.tsx:1\n');
  return raiz;
}

test('extrairCitacoes pega caminho, linha e range, e nao casa texto solto', () => {
  const c = extrairCitacoes('src/a.ts:5 e src/b.ts:2-8 e src/c.ts e versao 2.1:30 e solta.ts:9');
  assert.deepEqual(c, [
    { alvo: 'src/a.ts', linha: 5, ate: null },
    { alvo: 'src/b.ts', linha: 2, ate: 8 },
    { alvo: 'src/c.ts', linha: null, ate: null },
  ]);
});

test('extrairCitacoes nao repete a mesma citacao dentro do mesmo documento', () => {
  assert.equal(extrairCitacoes('src/a.ts:5 ... src/a.ts:5 ... src/a.ts:6').length, 2);
});

test('listarDocs pega os .md da raiz e de docs/, e ignora gerado e dependencia', () => {
  const docs = listarDocs(repoFalso());
  assert.deepEqual(docs, ['ESTADO.md', 'docs/guia.md']);
});

test('conferir separa arquivo inexistente de linha fora do arquivo', () => {
  const { citacoes, quebras } = conferir(repoFalso());
  assert.equal(citacoes, 6, '5 citacoes em ESTADO.md e 1 em docs/guia.md');
  assert.deepEqual(quebras, [
    'ESTADO.md -> src/pages/Contatos.tsx:999 (arquivo tem 10 linhas)',
    'ESTADO.md -> src/pages/Sumiu.tsx:3 (arquivo nao existe)',
  ]);
});

test('citacao sem linha so cobra a existencia do arquivo', () => {
  const raiz = repoFalso();
  fs.writeFileSync(path.join(raiz, 'SEMLINHA.md'), 'supabase/functions/x/index.ts e src/pages/Nada.tsx\n');
  const { quebras } = conferir(raiz);
  assert.ok(quebras.includes('SEMLINHA.md -> src/pages/Nada.tsx (arquivo nao existe)'));
  assert.ok(!quebras.some((q) => q.includes('functions/x/index.ts')), 'arquivo de 1 linha, sem linha citada, passa');
});

test('o range e cobrado pelo maior numero', () => {
  const raiz = repoFalso();
  fs.writeFileSync(path.join(raiz, 'RANGE.md'), 'src/pages/Contatos.tsx:8-40\n');
  const { quebras } = conferir(raiz);
  assert.ok(quebras.includes('RANGE.md -> src/pages/Contatos.tsx:8-40 (arquivo tem 10 linhas)'));
});

test('comparar devolve so a quebra que nao esta no baseline, e a que foi corrigida', () => {
  const atual = { citacoes: 3, quebras: ['a -> x (arquivo nao existe)', 'b -> y (arquivo nao existe)'] };
  const baseline = { quebras: ['a -> x (arquivo nao existe)', 'c -> z (arquivo nao existe)'] };
  assert.deepEqual(comparar(atual, baseline), {
    novas: ['b -> y (arquivo nao existe)'],
    corrigidas: ['c -> z (arquivo nao existe)'],
  });
});

test('o baseline e JSON estavel e carrega de volta igual', () => {
  const { quebras } = conferir(repoFalso());
  const texto = serializarBaseline(quebras);
  assert.equal(texto, serializarBaseline(quebras));
  assert.ok(texto.endsWith('\n'));
  assert.deepEqual(JSON.parse(texto).quebras, quebras);
  assert.equal(JSON.parse(texto).total, quebras.length);
});
