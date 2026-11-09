// Testes de scripts/inventario/gerar-edge-tabela.mjs e do modulo de extracao compartilhado.
// Rodar: node --test scripts/inventario/gerar-edge-tabela.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { extrairChamadas, constantesDeString } from './chamadas-supabase.mjs';
import { listarTs, sharedImportados, gerarEdgeTabela, serializar } from './gerar-edge-tabela.mjs';

function repoFalso() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-edge-'));
  const escrever = (rel, texto) => {
    fs.mkdirSync(path.join(raiz, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), texto);
  };

  escrever('supabase/functions/_shared/auth.ts', "export const auth = () => supabase.from('profiles').select('id');\n");
  escrever('supabase/functions/_shared/helpers_test.ts', "supabase.from('tabela_de_teste');\n");

  escrever('supabase/functions/ranqueia/index.ts', `import { auth } from '../_shared/auth.ts';
const BUCKET = 'anexos';
await supabase.from('contacts').select('*');
await supabase.storage.from(BUCKET).list();
await supabase.rpc('has_role');
await supabase.functions.invoke('outra-edge/parte');
`);
  escrever('supabase/functions/ranqueia/helpers.ts', "await supabase.from('companies').select('id');\n");
  escrever('supabase/functions/ranqueia/index.test.ts', "await supabase.from('nunca_conta').select('*');\n");

  escrever('supabase/functions/outra-edge/index.ts', "await supabase.from('contacts').update({});\n");
  escrever('supabase/functions/so-http/index.ts', 'export default () => new Response("ok");\n');
  escrever('supabase/functions/.keep/index.ts', "await supabase.from('oculta').select('*');\n");
  return raiz;
}

test('constantesDeString pega const de modulo e ignora const dentro de funcao', () => {
  const m = constantesDeString("const A = 'tab_a';\nfunction f() {\n  const B = 'tab_b';\n}\n");
  assert.equal(m.get('A'), 'tab_a');
  assert.equal(m.has('B'), false);
});

test('constantesDeString nao deixa chave desbalanceada dentro de string cegar os consts seguintes', () => {
  // Achado da auditoria adversarial de 2026-11-08: antes do fix, UMA string de uma linha com
  // chave solta (`'a { b'`) desregulava a contagem de profundidade para o resto do arquivo
  // inteiro, e todo const de modulo depois dela desaparecia do mapa em silencio.
  const m = constantesDeString("const TEXT = 'a { b';\nconst REAL = 'tabela_real';\n");
  assert.equal(m.get('REAL'), 'tabela_real');
});

test('constantesDeString ignora chave dentro de template literal de uma linha', () => {
  const m = constantesDeString("const A = `x {y} z`;\nconst B = 'tabela_b';\n");
  assert.equal(m.get('B'), 'tabela_b');
});

test('extrairChamadas separa tabela de bucket e aceita a URL direta', () => {
  const c = extrairChamadas("const B = 'midia';\nsupabase.from('contacts');\nsupabase.storage.from(B);\nfetch(`${U}/rest/v1/companies`);\nfetch(`${U}/functions/v1/enriquecer`);\n");
  assert.deepEqual([...new Set(c.tabelas)].sort(), ['companies', 'contacts']);
  assert.deepEqual(c.buckets, ['midia']);
  assert.deepEqual(c.edges, ['enriquecer']);
});

test('listarTs varre recursivo e deixa teste de fora', () => {
  const raiz = repoFalso();
  const achados = listarTs(path.join(raiz, 'supabase/functions/ranqueia')).map((p) => path.basename(p));
  assert.deepEqual(achados, ['helpers.ts', 'index.ts']);
});

test('sharedImportados resolve o import relativo de _shared e ignora o resto', () => {
  const raiz = repoFalso();
  const arq = path.join(raiz, 'supabase/functions/ranqueia/index.ts');
  const achados = sharedImportados(fs.readFileSync(arq, 'utf8'), arq, path.join(raiz, 'supabase/functions'));
  assert.deepEqual(achados.map((p) => path.basename(p)), ['auth.ts']);

  const semShared = sharedImportados("import x from './helpers.ts';\nimport y from 'npm:zod@4';\n", arq, path.join(raiz, 'supabase/functions'));
  assert.deepEqual(semShared, []);
});

test('gerarEdgeTabela soma a funcao, o helper local e o _shared importado', () => {
  const inv = gerarEdgeTabela(repoFalso());
  const r = inv.funcoes.ranqueia;

  assert.deepEqual(r.tabelas, ['companies', 'contacts', 'profiles'], 'profiles vem do _shared/auth.ts');
  assert.deepEqual(r.buckets, ['anexos']);
  assert.deepEqual(r.rpcs, ['has_role']);
  assert.deepEqual(r.invoca_edges, ['outra-edge'], 'invoke com sufixo de rota conta como a edge');
  assert.equal(r.arquivos, 2, 'arquivo de teste nao conta');
  assert.deepEqual(r.compartilhados, ['supabase/functions/_shared/auth.ts']);
  assert.ok(!r.tabelas.includes('nunca_conta'), 'tabela que so aparece em teste fica fora');
});

test('pasta que comeca com _ ou . nao e edge function; funcao sem tabela e contada', () => {
  const inv = gerarEdgeTabela(repoFalso());
  assert.deepEqual(Object.keys(inv.funcoes).sort(), ['outra-edge', 'ranqueia', 'so-http']);
  assert.deepEqual(inv.funcoes['so-http'].tabelas, []);
  assert.equal(inv.resumo.funcoes_sem_tabela, 1);
  assert.ok(!('tabela_de_teste' in inv.por_tabela), '_shared nao vira funcao fantasma');
});

test('o indice inverso lista toda funcao que toca a tabela', () => {
  const inv = gerarEdgeTabela(repoFalso());
  assert.deepEqual(inv.por_tabela.contacts, ['outra-edge', 'ranqueia']);
  assert.deepEqual(inv.por_tabela.profiles, ['ranqueia']);
  assert.deepEqual(inv.por_rpc.has_role, ['ranqueia']);
  // contacts, companies e profiles: tabela_de_teste nao entra porque _shared/helpers_test.ts e teste.
  assert.equal(inv.resumo.tabelas_distintas, 3);
});

test('a saida e deterministica e sem carimbo de data', () => {
  const raiz = repoFalso();
  const a = serializar(gerarEdgeTabela(raiz));
  assert.equal(a, serializar(gerarEdgeTabela(raiz)));
  assert.ok(a.endsWith('\n'));
  assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(a), 'sem data: o diff semanal nao pode ser ruido');
});

test('repositorio sem supabase/functions falha alto em vez de gerar inventario vazio', () => {
  const vazio = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-edge-vazio-'));
  assert.throws(() => gerarEdgeTabela(vazio), /supabase\/functions nao existe/);
});
