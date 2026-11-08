import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareSql } from './prepare-sql.mjs';

test('preserva BEGIN/COMMIT em funções e comentários, removendo só o wrapper externo', () => {
  const body = '\nCREATE FUNCTION f() RETURNS void AS $function$\nBEGIN\n RAISE NOTICE \'COMMIT;\';\nEND;\n$function$ LANGUAGE plpgsql;\n';
  assert.equal(prepareSql('/* BEGIN; */\nbegin;'+body+'commit;\n-- ROLLBACK;', 'migration'), body+'\n-- ROLLBACK;');
});
test('preserva blocos DO, dollar tags Unicode e transações dentro de strings', () => {
  const sql = 'DO $ação$ BEGIN PERFORM \'BEGIN;\'; END; $ação$; SELECT \'COMMIT;\', "ROLLBACK";';
  assert.equal(prepareSql(sql, 'migration'), sql);
});
test('preserva comentários aninhados e aspas duplicadas/escapadas', () => {
  const sql = `/* outer /* COMMIT; */ BEGIN; */ SELECT 'it''s COMMIT;', E'it\\'s BEGIN;', "a""COMMIT";`;
  assert.equal(prepareSql(sql, 'migration'), sql);
});
test('remove wrapper BEGIN/ROLLBACK da fixture mesmo na mesma linha', () => {
  assert.equal(prepareSql('BEGIN WORK; SELECT 1; ROLLBACK TRANSACTION;', 'fixture'), ' SELECT 1;');
});
test('aceita START TRANSACTION/END sem alterar o SQL de dentro', () => {
  assert.equal(prepareSql('START TRANSACTION; SELECT 1; END WORK;', 'migration'), ' SELECT 1;');
});
test('preserva SQL sem wrapper, incluindo delimitadores em strings multilinha', () => {
  const sql = `SELECT '\nBEGIN;\nCOMMIT;\n', $$ BEGIN; COMMIT; $$; -- COMMIT;`;
  assert.equal(prepareSql(sql, 'fixture'), sql);
});
test('rejeita comandos capazes de fechar ou substituir a transação externa', () => {
  for (const sql of [
    'COMMIT;', 'ROLLBACK;', 'BEGIN; SELECT 1;', 'SELECT 1; COMMIT;',
    'BEGIN; SELECT 1; COMMIT; SELECT 2;', 'BEGIN; COMMIT; BEGIN; COMMIT;',
    'BEGIN; SELECT 1; COMMIT AND CHAIN;', 'PREPARE TRANSACTION \'gate\';',
    'COMMIT PREPARED \'gate\';', 'ROLLBACK TO SAVEPOINT gate;', 'SAVEPOINT gate;',
    'BEGIN ISOLATION LEVEL SERIALIZABLE; SELECT 1; COMMIT;',
  ]) assert.throws(() => prepareSql(sql, 'migration'), /controle transacional inesperado/);
});
test('rejeita migration que faria rollback próprio em vez de ser aplicada', () => {
  assert.throws(() => prepareSql('BEGIN; SELECT 1; ROLLBACK;', 'migration'), /controle transacional inesperado/);
});
test('rejeita metacomandos psql que poderiam escapar do controle do runner', () => {
  for (const sql of ['\\i unsafe.sql', '\\connect other', '\\set ON_ERROR_STOP off']) {
    assert.throws(() => prepareSql(sql, 'fixture'), /metacomando psql/);
  }
});
test('rejeita SQL com comentário, string ou dollar quote incompletos', () => {
  for (const sql of ['/* BEGIN;', "SELECT 'COMMIT;", 'DO $fn$ BEGIN;', 'SELECT "a;']) {
    assert.throws(() => prepareSql(sql, 'fixture'), /não terminado/);
  }
});
test('preserva condicionais e wrapper interno usados pelas fixtures existentes', () => {
  const prefix = 'SELECT true AS rls_target_present \\gset\n\\if :rls_target_present\n';
  const suffix = '\n\\else\n\\echo SKIP: ausente\n\\endif';
  const result = prepareSql(prefix+'BEGIN; SELECT 1; ROLLBACK;'+suffix, 'fixture');
  assert.ok(result.includes('\\gset rls_gate_\n\\set rls_target_present :rls_gate_rls_target_present'));
  assert.ok(result.includes('\\if :rls_target_present\n SELECT 1;'+suffix));
  assert.ok(!result.includes('BEGIN;'));
  assert.ok(!result.includes('ROLLBACK;'));
});
test('permite echo e as configurações literais já usadas no gate', () => {
  const sql = "\\set ON_ERROR_STOP on\n\\set test_run '''mtta-sla-regression-run'''\n\\echo TEST: guard\nSELECT 1;";
  assert.equal(prepareSql(sql, 'fixture'), sql);
});
test('rejeita escapes de echo, configurações perigosas e condicionais incompletas', () => {
  for (const sql of [
    '\\echo foo \\gexec', '\\echo `danger`', '\\set AUTOCOMMIT on', '\\set ON_ERROR_STOP off',
    '\\set test_run COMMIT;', '\\if :rls_present\nSELECT 1;', '\\else', '\\endif',
    'SELECT 1 AS unrelated \\gset',
  ]) assert.throws(() => prepareSql(sql, 'fixture'));
});
test('não remove wrappers inválidos que contêm números ou literais', () => {
  for (const sql of ["BEGIN 'x'; SELECT 1; COMMIT;", 'BEGIN 1; SELECT 1; COMMIT;', 'START TRANSACTION 1; SELECT 1; COMMIT;']) {
    assert.throws(() => prepareSql(sql, 'migration'), /controle transacional inesperado/);
  }
});
