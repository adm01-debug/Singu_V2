// Testes de scripts/audit-ausentes.mjs e scripts/diff-tables.mjs em repositórios de mentira.
// Rodar: node --test scripts/audit-ausentes.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chamadasFrom, tabelasDoTypes, paraCsv, paraMarkdown } from './audit-ausentes.mjs';
import { chamadasRpc, funcoesDoTypes, sugerir } from './diff-tables.mjs';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const AUDIT = join(REPO, 'scripts/audit-ausentes.mjs');
const DIFF = join(REPO, 'scripts/diff-tables.mjs');

// Mesmo formato do `supabase gen types` (o do types.ts real).
const TYPES = `export type Database = {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
        }
      }
      deals: {
        Row: { id: string }
      }
    }
    Views: {
      vw_resumo: {
        Row: {
          id: string | null
        }
      }
    }
    Functions: {
      soma: { Args: { a: number }; Returns: number }
      sem_args: {
        Args: never
        Returns: Json
      }
      sobrecarga:
        | { Args: { a: number }; Returns: number }
        | { Args: never; Returns: number }
    }
    Enums: {
      status: "a" | "b"
    }
  }
}
`;

function repo(t, arquivos, nome = 'audit ç-') {
  const dir = mkdtempSync(join(tmpdir(), nome));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, conteudo] of Object.entries({ 'src/integrations/supabase/types.ts': TYPES, ...arquivos })) {
    if (conteudo === null) continue;
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo);
  }
  return dir;
}
const rodar = (script, args, cwd = tmpdir()) => {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
};

test('chamadasFrom: aspas, crase, `as never`, genérico, quebra de linha; ignora storage e variável', () => {
  const codigo = [
    "supabase.from('contacts').select()",
    'supabase.from("deals" as never).select()',
    'supabase.from<Foo>(`fantasma`).select()',
    'supabase\n  .from(\n    "em_outra_linha"\n  )',
    "supabase.storage.from('avatars').upload()",
    "supabase.storage\n  .from('anexos')",
    'supabase.from(tabela)',
    "Array.from('abc')",
  ].join('\n');
  assert.deepEqual(chamadasFrom(codigo).map((c) => c.tabela), ['contacts', 'deals', 'fantasma', 'em_outra_linha', 'abc']);
});

test('chamadasFrom: o exemplo é a linha de CADA ocorrência, inclusive a última linha sem \\n', () => {
  // Antes: o exemplo vinha de indexOf(), sempre a 1ª ocorrência, e a última linha perdia um caractere.
  const achados = chamadasFrom("const a = db.from('x').select('a');\nconst b = db.from('x').select('b')");
  assert.deepEqual(achados.map((c) => c.linha), ["const a = db.from('x').select('a');", "const b = db.from('x').select('b')"]);
});

test('tabelasDoTypes e funcoesDoTypes leem o formato do supabase gen types', () => {
  assert.deepEqual([...tabelasDoTypes(TYPES)].sort(), ['contacts', 'deals', 'vw_resumo']);
  assert.deepEqual([...funcoesDoTypes(TYPES)].sort(), ['sem_args', 'sobrecarga', 'soma']);
  assert.equal(tabelasDoTypes('export type Database = {}').size, 0);
});

test('chamadasRpc pega rpc com e sem argumentos', () => {
  assert.deepEqual(chamadasRpc("a.rpc('soma', { a: 1 }); b.rpc(\"sem_args\"); c.rpc('x' as never, {}); d.rpc(nome)"), ['soma', 'sem_args', 'x']);
});

test('audit: grava json/csv/md só com as ausentes, ordenadas por impacto e depois por nome', (t) => {
  const dir = repo(t, {
    'src/a.ts': "db.from('contacts'); db.from('zeta'); db.from('fantasma');",
    'src/sub/b.tsx': "db.from('fantasma'); db.from('alfa'); db.storage.from('bucket_x');",
    'src/c.js': "db.from('nao_conta_js');",
  });
  const saida = join(dir, 'saída');
  const r = rodar(AUDIT, ['--raiz', dir, '--saida', saida]);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /^OK 3 ausentes/);
  const json = JSON.parse(readFileSync(join(saida, 'tabelas-ausentes.json'), 'utf8'));
  assert.deepEqual(json.map((j) => [j.tabela, j.qtd_arquivos]), [['fantasma', 2], ['alfa', 1], ['zeta', 1]]);
  assert.deepEqual(json[0].arquivos, ['src/a.ts', 'src/sub/b.tsx']);
  assert.equal(readFileSync(join(saida, 'tabelas-ausentes.csv'), 'utf8'),
    'tabela,qtd_arquivos,arquivos\n"fantasma",2,"src/a.ts; src/sub/b.tsx"\n"alfa",1,"src/sub/b.tsx"\n"zeta",1,"src/a.ts"');
  const md = readFileSync(join(saida, 'tabelas-ausentes.md'), 'utf8');
  assert.match(md, /\*\*Total: 3\*\*/);
  assert.match(md, /\| 1 \| `fantasma` \| 2 \| `src\/a\.ts`, `src\/sub\/b\.tsx` \|/);
});

test('audit: mesmo formato dos arquivos versionados (cabeçalho do csv, chaves do json, título do md)', () => {
  const json = JSON.parse(readFileSync(join(REPO, 'scripts/tabelas-ausentes.json'), 'utf8'));
  assert.deepEqual(Object.keys(json[0]), ['tabela', 'qtd_arquivos', 'arquivos', 'exemplos_uso']);
  const csv = readFileSync(join(REPO, 'scripts/tabelas-ausentes.csv'), 'utf8').split('\n');
  assert.equal(csv[0], paraCsv([]));
  assert.equal(csv[1], paraCsv([json[0]]).split('\n')[1]);
  const md = readFileSync(join(REPO, 'scripts/tabelas-ausentes.md'), 'utf8').split('\n');
  const gerado = paraMarkdown(json).split('\n');
  assert.deepEqual(gerado.slice(0, 2), md.slice(0, 2));
  assert.deepEqual(gerado.slice(3, 12), md.slice(3, 12));
});

test('audit: csv escapa aspas e o md escapa | em caminho de arquivo', () => {
  const ausentes = [{ tabela: 't', qtd_arquivos: 1, arquivos: ['src/a"b|c.ts'], exemplos_uso: [] }];
  assert.equal(paraCsv(ausentes).split('\n')[1], '"t",1,"src/a""b|c.ts"');
  assert.match(paraMarkdown(ausentes), /`src\/a"b\\\|c\.ts`/);
});

test('audit: nenhuma ausente gera arquivos vazios válidos; rodar duas vezes dá bytes idênticos', (t) => {
  const dir = repo(t, { 'src/a.ts': "db.from('contacts')" });
  const r1 = rodar(AUDIT, ['--raiz', dir]);
  assert.equal(r1.code, 0, r1.err);
  assert.match(r1.out, /OK 0 ausentes\n {2}scripts\/tabelas-ausentes\.md/);
  const ler = () => ['json', 'csv', 'md'].map((e) => readFileSync(join(dir, 'scripts', `tabelas-ausentes.${e}`), 'utf8'));
  const antes = ler();
  assert.equal(antes[0], '[]');
  assert.equal(antes[1], 'tabela,qtd_arquivos,arquivos');
  rodar(AUDIT, ['--raiz', dir]);
  assert.deepEqual(ler(), antes);
});

test('audit: --dry-run não grava nada', (t) => {
  const dir = repo(t, { 'src/a.ts': "db.from('fantasma')" });
  const r = rodar(AUDIT, ['--raiz', dir, '--dry-run']);
  assert.equal(r.code, 0);
  assert.match(r.out, /fantasma \(1 arq\)\n.*nada gravado/);
  assert.equal(existsSync(join(dir, 'scripts')), false);
});

test('audit e diff: funcionam de qualquer cwd e não tocam nos arquivos versionados', () => {
  const alvo = join(REPO, 'scripts/tabelas-ausentes.json');
  const antes = statSync(alvo).mtimeMs;
  const a = rodar(AUDIT, ['--dry-run'], tmpdir());
  assert.equal(a.code, 0, a.err);
  assert.match(a.out, /^OK \d+ ausentes/);
  const d = rodar(DIFF, [], tmpdir());
  assert.equal(d.code, 0, d.err);
  assert.match(d.out, /^Tabelas usadas: \d{2,}\nJa existem no schema novo: \d{2,}\nAusentes: \d+\n/);
  assert.equal(statSync(alvo).mtimeMs, antes);
});

for (const [nome, script] of [['audit', AUDIT], ['diff', DIFF]]) {
  test(`${nome}: entradas inválidas saem com 2 e mensagem clara`, (t) => {
    const semTypes = repo(t, { 'src/integrations/supabase/types.ts': null, 'src/a.ts': 'x' });
    const r1 = rodar(script, ['--raiz', semTypes, '--dry-run']);
    assert.equal(r1.code, 2);
    assert.match(r1.err, /^ERRO: .*types\.ts não existe/);
    const typesVazio = repo(t, { 'src/integrations/supabase/types.ts': '', 'src/a.ts': "db.from('x')" });
    const r2 = rodar(script, ['--raiz', typesVazio, '--dry-run']);
    assert.equal(r2.code, 2);
    assert.match(r2.err, /nenhuma tabela reconhecida/);
    assert.equal(rodar(script, ['--raiz']).code, 2);
    assert.equal(rodar(script, ['--help']).code, 0);
  });
}

test('diff: separa tabela de RPC e confere RPC contra Functions', (t) => {
  // Antes: só `.rpc('x')` SEM argumentos era visto, e era cobrado como se fosse tabela.
  const dir = repo(t, {
    'src/a.ts': "db.from('contacts'); db.from('contact_fone'); db.rpc('soma', { a: 1 }); db.rpc('sem_args'); db.rpc('sobrecarga');",
    'src/b.ts': "db.rpc('rpc_fantasma', {}); db.from('contact_fone' as never);",
  });
  const r = rodar(DIFF, ['--raiz', dir]);
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /Tabelas usadas: 2\nJa existem no schema novo: 1\nAusentes: 1\n/);
  assert.match(r.out, /contact_fone: 2 arq {2}-> src\/a\.ts, src\/b\.ts/);
  assert.match(r.out, /contact_fone -> contacts/);
  assert.match(r.out, /RPCs usadas: 4\nRPCs ausentes em Functions: 1\n/);
  assert.match(r.out, /rpc_fantasma: 1 arq {2}-> src\/b\.ts/);
  assert.doesNotMatch(r.out.split('RPCs usadas')[0], /soma|sem_args|rpc_fantasma/);
});

test('diff: mais de 5 arquivos resume com (+N) e a saída é estável', (t) => {
  const arquivos = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`src/f${i}.ts`, "db.from('fantasma')"]));
  const dir = repo(t, arquivos);
  const r = rodar(DIFF, ['--raiz', dir]);
  assert.match(r.out, /fantasma: 7 arq {2}-> src\/f0\.ts, src\/f1\.ts, src\/f2\.ts, src\/f3\.ts, src\/f4\.ts \(\+2\)/);
  assert.equal(rodar(DIFF, ['--raiz', dir]).out, r.out);
});

test('sugerir: no máximo 5, exige metade dos pedaços do nome', () => {
  const existentes = ['contacts', 'contact_phones', 'deals', 'deal_rooms', 'a_contact', 'b_contact', 'c_contact', 'd_contact'];
  assert.deepEqual(sugerir('contact_x', existentes), ['contacts', 'contact_phones', 'a_contact', 'b_contact', 'c_contact']);
  assert.deepEqual(sugerir('nada_parecido_aqui', existentes), []);
  assert.deepEqual(sugerir('_', existentes), []);
});
