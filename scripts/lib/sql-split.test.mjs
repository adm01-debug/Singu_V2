// Testes do divisor de SQL e das transformações de idempotência (scripts/lib/sql-split.mjs).
// Rodar: node --test scripts/lib/sql-split.test.mjs
// Os casos marcados [PG] executam no Postgres local (PGHOST/PGPORT/PGUSER) e se pulam se não houver banco.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  comGuardaDeDuplicado, dividirInstrucoes, dividirSql, ErroSqlMalformado, juntarInstrucoes, sqlCriarEnum,
  tabelaCriada, tagLivre, tornarIdempotente,
} from './sql-split.mjs';
import { criarBanco, ConexaoPg, pgDisponivel, removerBanco } from './mgmt-mock.test.mjs';

const BS = '\\'; // uma barra invertida
const BOM = String.fromCharCode(0xfeff);

// [descrição, entrada, instruções esperadas]
const CASOS = [
  ['duas instruções simples', 'select 1; select 2;', ['select 1', 'select 2']],
  ['última instrução sem ponto e vírgula', 'select 1; select 2', ['select 1', 'select 2']],
  ['entrada vazia', '', []],
  ['só espaços e ponto e vírgula', ' ;; \n ; ', []],
  ['só comentários', '-- nada\n/* nada; mesmo */\n', []],
  ['comentário de linha ANTES da instrução não a descarta', '-- Generated 2026\n\nCREATE INDEX i ON t (a);', ['CREATE INDEX i ON t (a)']],
  ['cabeçalho de tabela (-- ─── t ───) não descarta o CREATE TABLE', '-- ─── public.t ───\nCREATE TABLE public.t (\n  id int\n);', ['CREATE TABLE public.t (\n  id int\n)']],
  ['comentário entre instruções', 'select 1;\n-- meio\nselect 2;', ['select 1', 'select 2']],
  ['; dentro de comentário de linha', 'select 1 -- a; b\n+ 2; select 3', ['select 1 -- a; b\n+ 2', 'select 3']],
  ['; dentro de comentário de bloco', 'select 1 /* a; b */ + 2; select 3', ['select 1 /* a; b */ + 2', 'select 3']],
  ['comentário de bloco aninhado', '/* a /* b; */ c; */ select 1; select 2', ['select 1', 'select 2']],
  ['comentário de bloco com várias linhas e aspas', "/* it's\n ; \"x */\nselect 1; select 2", ['select 1', 'select 2']],
  ['comentário final é removido (não engole o ; ao juntar)', 'select 1 -- fim\n; select 2 /* fim */;', ['select 1', 'select 2']],
  ['; dentro de string', "select 'a;b'; select 2", ["select 'a;b'", 'select 2']],
  ['aspa dobrada dentro de string', "select 'it''s; ok'; select 2", ["select 'it''s; ok'", 'select 2']],
  ['string vazia', "select ''; select 2", ["select ''", 'select 2']],
  ['string que é só uma aspa', "select ''''; select 2", ["select ''''", 'select 2']],
  ['string com quebra de linha e ;', "select 'a\n;b'; select 2", ["select 'a\n;b'", 'select 2']],
  ['barra invertida NÃO escapa em string padrão', `select 'a${BS}'; select 2`, [`select 'a${BS}'`, 'select 2']],
  ["E'...' com aspa escapada por barra", `select E'a${BS}';b'; select 2`, [`select E'a${BS}';b'`, 'select 2']],
  ["e'...' minúsculo", `select e'a${BS}';b'; select 2`, [`select e'a${BS}';b'`, 'select 2']],
  ["E'...' terminando em barra escapada", `select E'a${BS}${BS}'; select 2`, [`select E'a${BS}${BS}'`, 'select 2']],
  ["E'...' com aspa dobrada", "select E'a'';b'; select 2", ["select E'a'';b'", 'select 2']],
  ['identificador terminado em e não vira E-string', `select typee'a${BS}'; select 2`, [`select typee'a${BS}'`, 'select 2']],
  ["U&'...' segue a regra da string padrão", `select U&'d${BS}0061t${BS}${BS}'; select 2`, [`select U&'d${BS}0061t${BS}${BS}'`, 'select 2']],
  ['marcador de comentário dentro de string', "select '--'; select '/*'; select 3", ["select '--'", "select '/*'", 'select 3']],
  ['aspa dentro de comentário de linha', "-- it's\nselect 1; select 2", ['select 1', 'select 2']],
  ['cifrões dentro de comentário de linha', '-- $$\nselect 1; select 2', ['select 1', 'select 2']],
  ['identificador entre aspas com ; e apóstrofo', `create table "a;b's" (id int); select 1`, [`create table "a;b's" (id int)`, 'select 1']],
  ['aspas duplas dobradas no identificador', 'select 1 as "a"";b"; select 2', ['select 1 as "a"";b"', 'select 2']],
  ['policy com apóstrofo no nome (caso real de 07_policies.sql)', `CREATE POLICY "own contact's history" ON t USING (true); CREATE POLICY p2 ON t USING (true);`, [`CREATE POLICY "own contact's history" ON t USING (true)`, 'CREATE POLICY p2 ON t USING (true)']],
  ['$$ ... $$', 'do $$ begin perform 1; perform 2; end $$; select 2', ['do $$ begin perform 1; perform 2; end $$', 'select 2']],
  ['$function$ ... $function$ (formato de 08_functions.sql)', 'CREATE FUNCTION f() RETURNS int AS $function$\nBEGIN\n  RETURN 1;\nEND;\n$function$\n;\nselect 2;', ['CREATE FUNCTION f() RETURNS int AS $function$\nBEGIN\n  RETURN 1;\nEND;\n$function$', 'select 2']],
  ['$$ dentro de $tag$ não fecha', 'select $t$ a $$ ; $$ b $t$; select 2', ['select $t$ a $$ ; $$ b $t$', 'select 2']],
  ['$tag$ dentro de $$ não fecha', 'select $$ a $t$ ; b $$; select 2', ['select $$ a $t$ ; b $$', 'select 2']],
  ['apóstrofo solto dentro de dollar-quote', "select $f$ it's; $f$; select 2", ["select $f$ it's; $f$", 'select 2']],
  ['tag sensível a maiúsculas', 'select $a$ ; $A$ ; $a$; select 2', ['select $a$ ; $A$ ; $a$', 'select 2']],
  ['tags aninhadas', 'select $a$ $b$ ; $b$ ; $a$; select 2', ['select $a$ $b$ ; $b$ ; $a$', 'select 2']],
  ['tag com acento', 'select $ação$ ; $ação$; select 2', ['select $ação$ ; $ação$', 'select 2']],
  ['comentário dentro de dollar-quote', 'select $$ -- ; \n /* ; $$; select 2', ['select $$ -- ; \n /* ; $$', 'select 2']],
  ['dois dollar-quotes na mesma instrução', 'select $$a$$ || $$;$$; select 2', ['select $$a$$ || $$;$$', 'select 2']],
  ['$1 é parâmetro, não dollar-quote', 'select $1; select $2', ['select $1', 'select $2']],
  ['$1$ não abre dollar-quote', 'select $1$; select 2', ['select $1$', 'select 2']],
  ['parâmetro seguido de dollar-quote', 'select $1 || $$;$$; select 2', ['select $1 || $$;$$', 'select 2']],
  ['cifrão no meio de identificador', 'select a$b$c; select x$$; select 3', ['select a$b$c', 'select x$$', 'select 3']],
  ['; dentro de parênteses (CREATE RULE)', 'create rule r as on insert to t do also (insert into a values (1); insert into b values (2)); select 1', ['create rule r as on insert to t do also (insert into a values (1); insert into b values (2))', 'select 1']],
  ['parêntese fechando a mais não trava o divisor', 'select 1); select 2', ['select 1)', 'select 2']],
  ['parêntese dentro de string não conta', "select '('; select 2", ["select '('", 'select 2']],
  ['parêntese dentro de comentário não conta', 'select 1 -- (\n; select 2', ['select 1', 'select 2']],
  ['BEGIN ATOMIC em CREATE FUNCTION', 'create function f() returns int language sql begin atomic select 1; select 2; end; select 3', ['create function f() returns int language sql begin atomic select 1; select 2; end', 'select 3']],
  ['BEGIN ATOMIC com CASE ... END', 'create or replace function f(a int) returns int language sql begin atomic select case when a > 0 then 1 else 2 end; end; select 3', ['create or replace function f(a int) returns int language sql begin atomic select case when a > 0 then 1 else 2 end; end', 'select 3']],
  ['BEGIN ATOMIC em CREATE OR REPLACE PROCEDURE', 'CREATE OR REPLACE PROCEDURE p() LANGUAGE sql BEGIN ATOMIC insert into t values (1); insert into t values (2); END; select 1', ['CREATE OR REPLACE PROCEDURE p() LANGUAGE sql BEGIN ATOMIC insert into t values (1); insert into t values (2); END', 'select 1']],
  ['BEGIN/END de transação não agrupa', 'begin; select 1; end;', ['begin', 'select 1', 'end']],
  ['CASE ... END fora de função não agrupa', 'select case when true then 1 end; select 2', ['select case when true then 1 end', 'select 2']],
  ['argumento chamado begin (dentro de parênteses) não agrupa', 'create function f(begin int) returns int language sql return 1; select 2', ['create function f(begin int) returns int language sql return 1', 'select 2']],
  ['quebras de linha CRLF', 'select 1;\r\n-- c\r\nselect 2;\r\n', ['select 1', 'select 2']],
  ['BOM no início', `${BOM}select 1; select 2`, ['select 1', 'select 2']],
  ['acentos em string e identificador', `select 'ação; não' as "é;"; select 2`, [`select 'ação; não' as "é;"`, 'select 2']],
  ['operadores - e / não são comentário', 'select 1 - 1; select 4 / 2; select 3 * 2', ['select 1 - 1', 'select 4 / 2', 'select 3 * 2']],
  ['comentário no meio da instrução é preservado', 'select 1 /* meio */ + 2;', ['select 1 /* meio */ + 2']],
  ['tabulação e form feed são espaço', 'select 1;\t\f\nselect 2;', ['select 1', 'select 2']],
  ['view com ; só no fim (formato de 10_views.sql)', 'CREATE OR REPLACE VIEW v AS \n SELECT id\n   FROM t\n  WHERE (a IS NULL OR a > now());\nCREATE OR REPLACE VIEW w AS SELECT 1;', ['CREATE OR REPLACE VIEW v AS \n SELECT id\n   FROM t\n  WHERE (a IS NULL OR a > now())', 'CREATE OR REPLACE VIEW w AS SELECT 1']],
];

for (const [nome, entrada, esperado] of CASOS) {
  test(`divisor: ${nome}`, () => assert.deepEqual(dividirInstrucoes(entrada), esperado));
}

test(`divisor: ${CASOS.length} casos declarados (dezenas, por exigência)`, () => assert.ok(CASOS.length >= 60));

test('divisor: informa a linha (base 1) em que cada instrução começa', () => {
  const r = dividirSql("-- cabeçalho\n\nselect 1;\n/* bloco\n   longo */\nselect\n  'a\nb';\n\n  select 3;");
  assert.deepEqual(r.map((s) => s.linha), [3, 6, 10]);
  assert.deepEqual(dividirSql('select $$\n\n$$;\nselect 2').map((s) => s.linha), [1, 4]);
});

for (const [nome, entrada, trecho, linha] of [
  ['string', "select 1;\nselect 'abc", "string '...'", 2],
  ["string E'...'", `select E'abc${BS}'`, "string E'...'", 1],
  ['identificador', 'select 1 as "abc', 'identificador', 1],
  ['dollar-quote', 'select 1;\n\ndo $f$ begin end $$', 'dollar-quote $f$', 3],
  ['comentário de bloco', 'select 1;\n/* a /* b */', 'comentário', 2],
]) {
  test(`divisor: ${nome} sem fechamento lança ErroSqlMalformado com a linha`, () => {
    assert.throws(() => dividirSql(entrada), (e) => e instanceof ErroSqlMalformado && e.message.includes(trecho) && e.linha === linha);
  });
}

test('divisor: entrada que não é string é recusada', () => {
  for (const x of [null, undefined, 42, Buffer.from('select 1')]) assert.throws(() => dividirSql(x), TypeError);
});

test('divisor: juntar e dividir de novo dá o mesmo resultado (ida e volta)', () => {
  const todos = CASOS.map((c) => c[1]).join('\n;\n');
  const uma = dividirInstrucoes(todos);
  assert.deepEqual(dividirInstrucoes(juntarInstrucoes(uma)), uma);
  assert.equal(juntarInstrucoes(['a', { sql: 'b' }]), 'a;\nb;');
});

test('divisor: 20 mil instruções com função e string em menos de 3 s', () => {
  const bloco = "CREATE FUNCTION f() RETURNS int AS $f$ BEGIN RETURN 1; END; $f$;\nINSERT INTO t VALUES ('a;b', 1); -- c;\n";
  const t0 = Date.now();
  assert.equal(dividirSql(bloco.repeat(10000)).length, 20000);
  assert.ok(Date.now() - t0 < 3000, `demorou ${Date.now() - t0} ms`);
});

// ── DDL reais do repositório ────────────────────────────────────────────────────────────────────────
const DDL = fileURLToPath(new URL('../migration/ddl/', import.meta.url));
const ler = (f) => readFileSync(DDL + f, 'utf8');
const linhasQueComecam = (texto, re) => texto.split('\n').filter((l) => re.test(l)).length;

for (const [arquivo, re] of [
  ['01_schemas_and_enums.sql', /^CREATE (SCHEMA|TYPE) /], ['02_tables.sql', /^(CREATE TABLE|COMMENT ON) /],
  ['03_indexes.sql', /^CREATE (UNIQUE )?INDEX /], ['04_foreign_keys.sql', /^ALTER TABLE /], ['05_grants.sql', /^GRANT /],
  ['06_rls_enable.sql', /^ALTER TABLE /], ['07_policies.sql', /^CREATE POLICY /], ['08_functions.sql', /^CREATE OR REPLACE (FUNCTION|PROCEDURE) /],
  ['09_triggers.sql', /^CREATE TRIGGER /], ['10_views.sql', /^CREATE OR REPLACE VIEW /], ['11_partitions.sql', /^CREATE TABLE /],
]) {
  test(`DDL real ${arquivo}: uma instrução por comando, nenhuma perdida nem fundida`, () => {
    const texto = ler(arquivo);
    const partes = dividirSql(texto);
    assert.equal(partes.length, linhasQueComecam(texto, re));
    for (const p of partes) assert.match(p.sql, re, `instrução da linha ${p.linha} não começa pelo comando esperado`);
  });
}

// ── idempotência ────────────────────────────────────────────────────────────────────────────────────
const G = (s) => comGuardaDeDuplicado(s);
const IDEM = [
  ['CREATE TABLE public.t (id int)', 'CREATE TABLE IF NOT EXISTS public.t (id int)'],
  ['create table t (id int)', 'create table IF NOT EXISTS t (id int)'],
  ['CREATE TABLE "Minha Tabela" (id int)', 'CREATE TABLE IF NOT EXISTS "Minha Tabela" (id int)'],
  ['CREATE UNLOGGED TABLE t (id int)', 'CREATE UNLOGGED TABLE IF NOT EXISTS t (id int)'],
  ['CREATE TABLE IF NOT EXISTS t (id int)', 'CREATE TABLE IF NOT EXISTS t (id int)'],
  ['CREATE TABLE public.p1 PARTITION OF public.p DEFAULT', 'CREATE TABLE IF NOT EXISTS public.p1 PARTITION OF public.p DEFAULT'],
  ['CREATE TABLE public.p (\n  id int\n) PARTITION BY RANGE (id)', 'CREATE TABLE IF NOT EXISTS public.p (\n  id int\n) PARTITION BY RANGE (id)'],
  ['CREATE INDEX i ON public.t USING btree (a)', 'CREATE INDEX IF NOT EXISTS i ON public.t USING btree (a)'],
  ['CREATE UNIQUE INDEX i ON t (a) WHERE (b IS NOT NULL)', 'CREATE UNIQUE INDEX IF NOT EXISTS i ON t (a) WHERE (b IS NOT NULL)'],
  ['CREATE INDEX CONCURRENTLY i ON t (a)', 'CREATE INDEX IF NOT EXISTS i ON t (a)'],
  ['CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS i ON t (a)', 'CREATE UNIQUE INDEX IF NOT EXISTS i ON t (a)'],
  ['CREATE INDEX IF NOT EXISTS i ON t (a)', 'CREATE INDEX IF NOT EXISTS i ON t (a)'],
  ["CREATE TYPE public.e AS ENUM ('a', 'b')", G("CREATE TYPE public.e AS ENUM ('a', 'b')")],
  ['CREATE POLICY p ON public.t AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id))', G('CREATE POLICY p ON public.t AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id))')],
  ['CREATE TRIGGER tg BEFORE UPDATE ON t FOR EACH ROW EXECUTE FUNCTION f()', G('CREATE TRIGGER tg BEFORE UPDATE ON t FOR EACH ROW EXECUTE FUNCTION f()')],
  ['CREATE CONSTRAINT TRIGGER tg AFTER INSERT ON t FOR EACH ROW EXECUTE FUNCTION f()', G('CREATE CONSTRAINT TRIGGER tg AFTER INSERT ON t FOR EACH ROW EXECUTE FUNCTION f()')],
  ['ALTER TABLE public.t ADD CONSTRAINT t_fk FOREIGN KEY (a) REFERENCES u(id) ON DELETE CASCADE', G('ALTER TABLE public.t ADD CONSTRAINT t_fk FOREIGN KEY (a) REFERENCES u(id) ON DELETE CASCADE')],
  ['CREATE DOMAIN d AS int', G('CREATE DOMAIN d AS int')],
  // já idempotentes: passam intactas
  ...['CREATE OR REPLACE FUNCTION f() RETURNS int LANGUAGE sql AS $$ select 1 $$', 'CREATE OR REPLACE VIEW v AS SELECT 1',
    'GRANT ALL ON public.t TO service_role', 'ALTER TABLE public.t ENABLE ROW LEVEL SECURITY', "COMMENT ON TABLE t IS 'CREATE TABLE x'",
    'CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions', 'CREATE SCHEMA IF NOT EXISTS public', 'ALTER TABLE t ADD COLUMN c int',
    'SELECT 1'].map((s) => [s, s]),
];
for (const [entrada, esperado] of IDEM) {
  test(`idempotência: ${entrada.slice(0, 60).replace(/\n/g, ' ')}`, () => {
    assert.equal(tornarIdempotente(entrada), esperado);
    assert.equal(tornarIdempotente(esperado), esperado, 'aplicar duas vezes não muda mais nada');
    assert.equal(dividirInstrucoes(`${esperado};`).length, 1, 'o resultado continua sendo UMA instrução');
  });
}

test('idempotência: a guarda escolhe uma tag de dollar-quote que não colide com o corpo', () => {
  assert.equal(tagLivre('nada'), '$idem$');
  const corpo = "CREATE POLICY p ON t USING (x = $idem$a$idem$ AND y = $idem1$b$idem1$)";
  assert.equal(tagLivre(corpo), '$idem2$');
  assert.deepEqual(dividirInstrucoes(`${G(corpo)}; select 1`).length, 2);
});

test('tabelaCriada: esquema e nome como o Postgres guarda', () => {
  assert.deepEqual(tabelaCriada('CREATE TABLE public.Abc (id int)'), { esquema: 'public', nome: 'abc' });
  assert.deepEqual(tabelaCriada('CREATE TABLE IF NOT EXISTS t (id int)'), { esquema: null, nome: 't' });
  assert.deepEqual(tabelaCriada('create table "S"."Minha ""T"""(id int)'), { esquema: 'S', nome: 'Minha "T"' });
  assert.deepEqual(tabelaCriada('CREATE TABLE public.p1 PARTITION OF public.p DEFAULT'), { esquema: 'public', nome: 'p1' });
  for (const s of ['CREATE INDEX i ON t (a)', "COMMENT ON TABLE t IS 'CREATE TABLE x (id int)'", 'CREATE TABLESPACE x LOCATION 1']) assert.equal(tabelaCriada(s), null);
});

test('sqlCriarEnum: cita rótulos, recusa nome inválido e lista vazia', () => {
  assert.equal(sqlCriarEnum('public.e', ['a', "b'c"]), G("CREATE TYPE public.e AS ENUM ('a', 'b''c')"));
  for (const nome of ['e; drop table x', 'E', 'a.b.c', '']) assert.throws(() => sqlCriarEnum(nome, ['a']), /inválido/);
  assert.throws(() => sqlCriarEnum('public.e', []), /sem valores/);
});

// ── [PG] o que o divisor e as transformações produzem roda de verdade ───────────────────────────────
const pular = (await pgDisponivel()) ? false : 'Postgres local indisponível (defina PGHOST/PGPORT/PGUSER)';

test('[PG] cada caso sintaticamente completo vira exatamente UM comando no servidor', { skip: pular }, async () => {
  const banco = await criarBanco('split');
  const c = await ConexaoPg.abrir(banco);
  try {
    let conferidas = 0;
    for (const [nome, , esperado] of CASOS) {
      for (const instrucao of esperado) {
        const r = await c.consultar(instrucao);
        if (r.emTransacao) await c.consultar('ROLLBACK');
        // Erro semântico (tabela inexistente etc.) é esperado; erro de SINTAXE ou mais de um comando indicaria corte errado.
        // Exceção: os 4 casos que são SQL inválido de propósito (só exercitam o léxico).
        if (r.erro) { if (r.erro.code === '42601' && !/1\)|\$1\$|typee|x\$\$/.test(instrucao)) assert.fail(`${nome}: sintaxe inválida em ${instrucao}`); continue; }
        assert.equal(r.comandos, 1, `${nome}: ${instrucao}`);
        conferidas++;
      }
    }
    assert.ok(conferidas >= 60, `só ${conferidas} instruções executaram`);
  } finally { c.fechar(); await removerBanco(banco); }
});

test('[PG] instruções idempotentes rodam duas vezes sem erro e criam o objeto', { skip: pular }, async () => {
  const banco = await criarBanco('idem');
  const c = await ConexaoPg.abrir(banco);
  try {
    const cru = [
      "CREATE TYPE public.humor AS ENUM ('bom', 'ruim')", 'CREATE TABLE public.u (id int PRIMARY KEY)',
      'CREATE TABLE public.t (id int PRIMARY KEY, u_id int, h public.humor, user_id uuid)',
      'CREATE TABLE public.p (id int, d date) PARTITION BY RANGE (d)', "CREATE TABLE public.p1 PARTITION OF public.p FOR VALUES FROM ('2026-01-01') TO ('2027-01-01')",
      'CREATE INDEX CONCURRENTLY t_u ON public.t USING btree (u_id)', 'CREATE UNIQUE INDEX t_h ON public.t (h) WHERE (h IS NOT NULL)',
      'ALTER TABLE public.t ADD CONSTRAINT t_u_fk FOREIGN KEY (u_id) REFERENCES u(id) ON DELETE CASCADE',
      'CREATE OR REPLACE FUNCTION public.toca() RETURNS trigger LANGUAGE plpgsql AS $function$ BEGIN RETURN NEW; END; $function$',
      'ALTER TABLE public.t ENABLE ROW LEVEL SECURITY',
      `CREATE POLICY "dono's" ON public.t AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id))`,
      'CREATE TRIGGER t_toca BEFORE UPDATE ON t FOR EACH ROW EXECUTE FUNCTION toca()', 'CREATE DOMAIN public.positivo AS int CHECK (VALUE > 0)',
    ];
    for (const s of cru) assert.equal((await c.consultar(tornarIdempotente(s))).erro, null, s);
    assert.match((await c.consultar(cru[0])).erro.message, /already exists/, 'sem a transformação a 2ª execução falha');
    // 2ª rodada: tudo num único POST (transação implícita), como o chunk-apply e o apply-migrations enviam.
    const lote = await c.consultar(juntarInstrucoes(cru.map((s) => tornarIdempotente(s))));
    assert.equal(lote.erro, null);
    assert.equal(lote.comandos, cru.length);
    const [{ n }] = (await c.consultar("select (select count(*) from pg_policies where policyname = 'dono''s') + (select count(*) from pg_trigger where tgname = 't_toca') + (select count(*) from pg_constraint where conname = 't_u_fk') + (select count(*) from pg_indexes where indexname in ('t_u', 't_h')) + (select count(*) from pg_type where typname in ('humor', 'positivo')) + (select count(*) from pg_class where relname = 'p1') AS n")).linhas;
    assert.equal(n, 8);
  } finally { c.fechar(); await removerBanco(banco); }
});
