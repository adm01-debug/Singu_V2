// Testes dos checks de catálogo de scripts/hardening (PK, publicação, índices, SECURITY DEFINER, extensões).
// Cada check é provado nos dois lados: condição ruim plantada -> acusa (código 3); sem ela -> limpo (código 0).
// Precisa de Postgres em PGHOST/PGPORT/PGUSER; sem banco, os testes se pulam.
//   PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres node --test scripts/hardening/hardening.test.mjs
import assert from 'node:assert/strict';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { bancoDisponivel, criarBanco, psql, removerBanco, rodarArquivo, sql } from './_pg-teste.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const disponibilidade = bancoDisponivel();
const pular = disponibilidade.ok ? false : disponibilidade.motivo;
const CATALOGO = ['check-tables-without-pk', 'check-publication-without-pk', 'check-indexes-duplicated',
  'check-indexes-overlapped', 'check-indexes-unused', 'check-security-definer-search-path'];

let banco;
const alvo = () => ({ banco });
const check = (nome, variaveis = {}, extras = [], env = {}) =>
  rodarArquivo(path.join(AQUI, `${nome}.sql`), { ...alvo(), env }, variaveis, extras);

function limpo(r, nome) {
  assert.equal(r.status, 0, `${nome} deveria passar.\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.equal(r.stdout.trim().split('\n').pop(), `OK ${nome}.`);
}
function acusa(r, nome, quantidade, ...trechos) {
  assert.equal(r.status, 3, `${nome} deveria acusar (código 3).\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  assert.match(r.stderr, new RegExp(`FATAL: ${nome}: ${quantidade} `));
  assert.doesNotMatch(r.stdout, new RegExp(`OK ${nome}\\.`));
  for (const trecho of trechos) assert.ok(r.stdout.includes(trecho), `stdout deveria listar ${trecho}:\n${r.stdout}`);
}
const recomecar = () => sql('DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS legado CASCADE; CREATE SCHEMA public;', alvo());

describe('hardening: checks de catálogo', { skip: pular }, () => {
  before(() => { banco = criarBanco('hard'); });
  after(() => { if (banco) removerBanco(banco); });

  test('banco limpo: todos passam, com cabeçalho e linha final padronizados', () => {
    recomecar();
    for (const nome of CATALOGO) {
      const r = check(nome);
      limpo(r, nome);
      assert.equal(r.stdout.split('\n')[0], `== ${nome} ==`);
    }
  });

  test('objetos legítimos que a versão antiga acusava não geram achado', () => {
    recomecar();
    sql(`CREATE TABLE com_pk(id int PRIMARY KEY, a int, b int, ativo bool);
         CREATE UNIQUE INDEX uq_a ON com_pk(a);
         CREATE INDEX ix_a_b ON com_pk(a, b);
         CREATE INDEX ix_id_parcial ON com_pk(id) WHERE ativo;
         CREATE INDEX ix_expr1 ON com_pk(a, (b + 1));
         CREATE INDEX ix_expr2 ON com_pk(a, (b + 2));
         CREATE FUNCTION f_seguro() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = '' AS 'select 1';`, alvo());
    for (const nome of CATALOGO) limpo(check(nome), nome);
  });

  test('somente leitura: todos rodam com default_transaction_read_only=on', () => {
    for (const nome of CATALOGO) {
      const r = check(nome, {}, [], { PGOPTIONS: '-c default_transaction_read_only=on' });
      assert.equal(r.status, 0, `${nome}: ${r.stderr}`);
    }
  });

  test('tables-without-pk: acusa tabela sem PK e limpa ao criar a PK', () => {
    recomecar();
    sql('CREATE TABLE sem_pk(a int); CREATE TABLE "Com Espaço"(a int);', alvo());
    acusa(check('check-tables-without-pk'), 'check-tables-without-pk', 2, 'sem_pk', 'Com Espaço');
    sql('ALTER TABLE sem_pk ADD PRIMARY KEY (a); ALTER TABLE "Com Espaço" ADD PRIMARY KEY (a);', alvo());
    limpo(check('check-tables-without-pk'), 'check-tables-without-pk');
  });

  test('tables-without-pk: particionada conta uma vez; partição filha, temporária e tabela de extensão não contam', () => {
    recomecar();
    sql(`CREATE TABLE medidas(id int, dia date) PARTITION BY RANGE (dia);
         CREATE TABLE medidas_2026 PARTITION OF medidas FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');`, alvo());
    const r = check('check-tables-without-pk');
    acusa(r, 'check-tables-without-pk', 1, 'medidas', 'particionada');
    assert.ok(!r.stdout.includes('medidas_2026'));
    sql(`DROP TABLE medidas; CREATE TABLE de_extensao(a int); ALTER EXTENSION plpgsql ADD TABLE de_extensao;`, alvo());
    // a tabela temporária é criada na MESMA sessão que roda o check
    limpo(check('check-tables-without-pk', {}, ['-c', 'CREATE TEMP TABLE t_tmp(a int)']), 'check-tables-without-pk');
    sql('ALTER EXTENSION plpgsql DROP TABLE de_extensao;', alvo());
    acusa(check('check-tables-without-pk'), 'check-tables-without-pk', 1, 'de_extensao');
  });

  test('tables-without-pk: parâmetros ignorar e ignorar_schemas', () => {
    recomecar();
    sql('CREATE TABLE sem_pk(a int); CREATE SCHEMA legado; CREATE TABLE legado.velha(a int); CREATE SCHEMA auth; CREATE TABLE auth.interna(a int);', alvo());
    acusa(check('check-tables-without-pk'), 'check-tables-without-pk', 2, 'sem_pk', 'velha'); // auth é ignorado por padrão
    limpo(check('check-tables-without-pk', { ignorar: 'public.sem_pk , legado.velha' }), 'check-tables-without-pk');
    acusa(check('check-tables-without-pk', { ignorar_schemas: 'legado' }), 'check-tables-without-pk', 2, 'sem_pk', 'interna');
    acusa(check('check-tables-without-pk', { ignorar_schemas: '' }), 'check-tables-without-pk', 3);
    sql('DROP SCHEMA auth CASCADE;', alvo());
  });

  test('publication-without-pk: acusa sem PK; REPLICA IDENTITY FULL, só-INSERT e PK limpam', () => {
    recomecar();
    sql('CREATE TABLE evento(a int); CREATE PUBLICATION g3_pub FOR TABLE evento;', alvo());
    acusa(check('check-publication-without-pk'), 'check-publication-without-pk', 1, 'g3_pub', 'public.evento', 'DEFAULT (sem PK)');
    sql('ALTER TABLE evento REPLICA IDENTITY FULL;', alvo());
    limpo(check('check-publication-without-pk'), 'check-publication-without-pk');
    sql("ALTER TABLE evento REPLICA IDENTITY DEFAULT; ALTER PUBLICATION g3_pub SET (publish = 'insert');", alvo());
    limpo(check('check-publication-without-pk'), 'check-publication-without-pk');
    sql("ALTER PUBLICATION g3_pub SET (publish = 'insert, update, delete'); ALTER TABLE evento ADD PRIMARY KEY (a);", alvo());
    limpo(check('check-publication-without-pk'), 'check-publication-without-pk');
    sql('ALTER TABLE evento REPLICA IDENTITY NOTHING;', alvo());
    acusa(check('check-publication-without-pk'), 'check-publication-without-pk', 1, 'NOTHING');
    limpo(check('check-publication-without-pk', { ignorar: 'public.evento' }), 'check-publication-without-pk');
    sql('DROP PUBLICATION g3_pub;', alvo());
  });

  test('publication-without-pk: publicação FOR ALL TABLES também é coberta', () => {
    recomecar();
    sql('CREATE TABLE ok(id int PRIMARY KEY); CREATE TABLE solta(a int); CREATE PUBLICATION g3_todas FOR ALL TABLES;', alvo());
    const r = check('check-publication-without-pk');
    acusa(r, 'check-publication-without-pk', 1, 'g3_todas', 'public.solta');
    assert.ok(!r.stdout.includes('public.ok'));
    sql('DROP PUBLICATION g3_todas;', alvo());
  });

  test('indexes-duplicated: acusa cópia idêntica e indica qual manter', () => {
    recomecar();
    sql(`CREATE TABLE t(id int PRIMARY KEY, a int, b text);
         CREATE INDEX ix_a1 ON t(a); CREATE INDEX ix_a2 ON t(a);
         CREATE UNIQUE INDEX uq_b ON t(b); CREATE INDEX ix_b ON t(b);`, alvo());
    const r = check('check-indexes-duplicated');
    acusa(r, 'check-indexes-duplicated', 2, 'btree:ix_a1', 'btree:ix_a2', 'btree:uq_b', 'btree:ix_b');
    assert.match(r.stdout, /ix_b\s*\|\s*uq_b|uq_b\s*\|\s*btree:ix_b\s*\|\s*uq_b|\|\s*uq_b\s*$/m);
    limpo(check('check-indexes-duplicated', { ignorar: 'public.ix_a2,public.ix_b' }), 'check-indexes-duplicated');
    sql('DROP INDEX ix_a2, ix_b;', alvo());
    limpo(check('check-indexes-duplicated'), 'check-indexes-duplicated');
  });

  test('indexes-duplicated: parcial, expressão, ordem, opclass e INCLUDE diferentes não são duplicata', () => {
    recomecar();
    sql(`CREATE TABLE t(id int PRIMARY KEY, a int, b text, ativo bool);
         CREATE INDEX i1 ON t(a); CREATE INDEX i2 ON t(a) WHERE ativo; CREATE INDEX i3 ON t(a DESC);
         CREATE INDEX i4 ON t(a) INCLUDE (b); CREATE INDEX i5 ON t(b); CREATE INDEX i6 ON t(b text_pattern_ops);
         CREATE INDEX i7 ON t(lower(b)); CREATE INDEX i8 ON t(upper(b)); CREATE INDEX i9 ON t USING hash (a);`, alvo());
    limpo(check('check-indexes-duplicated'), 'check-indexes-duplicated');
    sql('CREATE INDEX i7b ON t(lower(b)); CREATE INDEX i2b ON t(a) WHERE ativo;', alvo());
    acusa(check('check-indexes-duplicated'), 'check-indexes-duplicated', 2, 'i7b', 'i2b');
  });

  test('indexes-overlapped: acusa prefixo redundante e limpa ao remover', () => {
    recomecar();
    sql('CREATE TABLE t(id int PRIMARY KEY, a int, b int, c int); CREATE INDEX ix_a ON t(a); CREATE INDEX ix_a_b ON t(a, b);', alvo());
    acusa(check('check-indexes-overlapped'), 'check-indexes-overlapped', 1, 'ix_a', 'ix_a_b');
    limpo(check('check-indexes-overlapped', { ignorar: 'public.ix_a' }), 'check-indexes-overlapped');
    sql('DROP INDEX ix_a;', alvo());
    limpo(check('check-indexes-overlapped'), 'check-indexes-overlapped');
  });

  test('indexes-overlapped: único/PK, parcial, ordem, INCLUDE, expressão e outro método não são sobreposição', () => {
    recomecar();
    sql(`CREATE TABLE t(id int PRIMARY KEY, a int, b int, c int, tags int[], ativo bool);
         CREATE INDEX ix_id_a ON t(id, a);                       -- PK(id) é prefixo, mas garante unicidade
         CREATE UNIQUE INDEX uq_a ON t(a); CREATE INDEX ix_a_b ON t(a, b);
         CREATE INDEX ix_b_parcial ON t(b) WHERE ativo; CREATE INDEX ix_b_c ON t(b, c);
         CREATE INDEX ix_c ON t(c DESC); CREATE INDEX ix_c_a ON t(c, a);
         CREATE INDEX ix_tags ON t USING gin (tags);
         CREATE INDEX ix_e ON t((a + b)); CREATE INDEX ix_e2 ON t((a + b), c);`, alvo());
    limpo(check('check-indexes-overlapped'), 'check-indexes-overlapped');
    sql('CREATE INDEX ix_b_inc ON t(b) INCLUDE (a);', alvo());
    limpo(check('check-indexes-overlapped'), 'check-indexes-overlapped');
    sql('CREATE INDEX ix_b ON t(b);', alvo()); // prefixo de ix_b_c e do mesmo predicado -> redundante
    acusa(check('check-indexes-overlapped'), 'check-indexes-overlapped', 1, 'ix_b', 'ix_b_c');
  });

  test('indexes-unused: acusa índice nunca lido em tabela grande; uso, tabela pequena e UNIQUE limpam', () => {
    recomecar();
    sql(`CREATE TABLE grande(id int PRIMARY KEY, a int, b int UNIQUE);
         INSERT INTO grande SELECT g, g, g FROM generate_series(1, 3000) g;
         CREATE INDEX ix_grande_a ON grande(a);
         CREATE TABLE pequena(id int PRIMARY KEY, a int); INSERT INTO pequena VALUES (1, 1);
         CREATE INDEX ix_pequena_a ON pequena(a);
         ANALYZE grande; ANALYZE pequena;`, alvo());
    const r = check('check-indexes-unused');
    acusa(r, 'check-indexes-unused', 1, 'ix_grande_a');
    assert.ok(!r.stdout.includes('grande_b_key') && !r.stdout.includes('grande_pkey') && !r.stdout.includes('ix_pequena_a'));
    assert.match(r.stdout, /estatisticas_zeradas_em/);
    limpo(check('check-indexes-unused', { min_linhas: 5000 }), 'check-indexes-unused');
    limpo(check('check-indexes-unused', { ignorar: 'public.ix_grande_a' }), 'check-indexes-unused');
    sql('SET enable_seqscan = off; SELECT count(*) FROM grande WHERE a = 42; SELECT pg_stat_force_next_flush();', alvo());
    limpo(check('check-indexes-unused'), 'check-indexes-unused');
  });

  test('security-definer: acusa search_path ausente, em public ou com $user; aceita vazio e pg_catalog primeiro', () => {
    recomecar();
    sql(`CREATE FUNCTION sd_sem() RETURNS int LANGUAGE sql SECURITY DEFINER AS 'select 1';
         CREATE FUNCTION sd_public(x int) RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public AS 'select 1';
         CREATE FUNCTION sd_public(x text) RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_catalog AS 'select 1';
         CREATE FUNCTION sd_user() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, "$user" AS 'select 1';
         CREATE FUNCTION sd_vazio() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = '' AS 'select 1';
         CREATE FUNCTION sd_ok() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, public AS 'select 1';
         CREATE FUNCTION sd_ok2() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = "pg_catalog" SET work_mem = '4MB' AS 'select 1';
         CREATE FUNCTION invoker_livre() RETURNS int LANGUAGE sql AS 'select 1';`, alvo());
    const r = check('check-security-definer-search-path');
    acusa(r, 'check-security-definer-search-path', 4, 'public.sd_sem', 'x integer', 'x text', 'public.sd_user', 'nao definido');
    for (const ok of ['sd_vazio', 'sd_ok', 'invoker_livre']) assert.ok(!r.stdout.includes(ok), `${ok} não deveria aparecer`);
    limpo(check('check-security-definer-search-path', { ignorar: 'public.sd_sem,public.sd_public,public.sd_user' }),
      'check-security-definer-search-path');
    sql(`ALTER FUNCTION sd_sem() SET search_path = pg_catalog, public; DROP FUNCTION sd_public(int), sd_public(text), sd_user();`, alvo());
    limpo(check('check-security-definer-search-path'), 'check-security-definer-search-path');
  });

  test('security-definer: schema da plataforma é ignorado por padrão e auditável sob pedido', () => {
    recomecar();
    sql(`CREATE SCHEMA pgbouncer; CREATE FUNCTION pgbouncer.get_auth() RETURNS int LANGUAGE sql SECURITY DEFINER AS 'select 1';`, alvo());
    limpo(check('check-security-definer-search-path'), 'check-security-definer-search-path');
    acusa(check('check-security-definer-search-path', { ignorar_schemas: '' }), 'check-security-definer-search-path', 1, 'pgbouncer.get_auth');
    sql('DROP SCHEMA pgbouncer CASCADE;', alvo());
  });

  test('extensions-hardening: acusa obrigatória ausente, respeita listas e o modo estrito', () => {
    const nome = 'check-extensions-hardening';
    const padrao = check(nome);
    assert.equal(padrao.status, 3, padrao.stderr);
    assert.match(padrao.stderr, /FATAL: check-extensions-hardening: extensoes OBRIGATORIAS ausentes:.*pg_cron.*pg_net/);
    assert.match(padrao.stdout, /plpgsql\s*\|\s*obrigatoria\s*\|\s*t/);
    const soPlpgsql = check(nome, { obrigatorias: 'plpgsql' });
    limpo(soPlpgsql, nome);
    assert.match(soPlpgsql.stdout, /AVISO: extensoes opcionais de hardening ausentes: amcheck, pg_stat_monitor, pg_visibility/);
    const estrito = check(nome, { obrigatorias: 'plpgsql', strict_optional: 1 });
    assert.equal(estrito.status, 3);
    assert.match(estrito.stderr, /FATAL: check-extensions-hardening \(strict\)/);
    const semOpcionais = check(nome, { obrigatorias: ' plpgsql ', opcionais: '' });
    limpo(semOpcionais, nome);
    assert.doesNotMatch(semOpcionais.stdout, /AVISO/);
    const falta = check(nome, { obrigatorias: 'plpgsql,nao_existe_g3', opcionais: '' });
    assert.equal(falta.status, 3);
    assert.match(falta.stderr, /ausentes: nao_existe_g3/);
  });

  test('extensions-hardening: instalar a extensão que faltava limpa o achado', (t) => {
    const nome = 'check-extensions-hardening';
    if (sql("SELECT count(*) FROM pg_available_extensions WHERE name = 'pgcrypto'", alvo()) !== '1') {
      t.skip('contrib pgcrypto não disponível neste servidor');
      return;
    }
    assert.equal(check(nome, { obrigatorias: 'plpgsql,pgcrypto', opcionais: '' }).status, 3);
    sql('CREATE EXTENSION pgcrypto;', alvo());
    limpo(check(nome, { obrigatorias: 'plpgsql,pgcrypto', opcionais: '' }), nome);
  });

  test('banco inexistente: erro de conexão não vira OK', () => {
    const r = psql(['-f', path.join(AQUI, 'check-tables-without-pk.sql')], { banco: 'g3_banco_que_nao_existe' });
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.stdout, /OK check-tables-without-pk/);
  });
});
