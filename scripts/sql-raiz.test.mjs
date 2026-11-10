// Testes dos SQL avulsos da raiz de scripts/ (família get_unified_communication_history, view de saúde
// dos dados e explain-top-queries). Rodam cada arquivo de verdade num Postgres descartável com stubs.
// Precisa de PGHOST/PGPORT/PGUSER; sem banco, os testes se pulam com o motivo.
//   PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres node --test scripts/sql-raiz.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { bancoDisponivel, clusterEfemero, criarBanco, garantirRolesSupabase, removerBanco, rodarArquivo, sql }
  from './hardening/_pg-teste.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.dirname(AQUI);
const MIGRATION_VIEW = path.join(RAIZ, 'supabase/migrations/20261013033429_data_health_weighted_score.sql');
const ARQUIVOS = ['check_unified_comm.sql', 'drop_unified_comm.sql', 'get_unified_def.sql', 'recreate_unified_comm.sql',
  'recreate_data_health_view.sql', 'test_unified_comm.sql', 'test_unified_comm2.sql', 'explain-top-queries.sql'];
const FN = 'public.get_unified_communication_history';
const EMPRESA = '11111111-2222-4333-8444-555555555555';
const ler = (nome) => readFileSync(path.join(AQUI, nome), 'utf8');
const disponibilidade = bancoDisponivel();

describe('SQL da raiz: verificações estáticas', () => {
  test('nenhum UUID real gravado e cabeçalho com propósito, uso e risco', () => {
    for (const nome of ARQUIVOS) {
      const texto = ler(nome);
      const uuids = (texto.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) ?? [])
        .filter((u) => u !== '00000000-0000-0000-0000-000000000000');
      assert.deepEqual(uuids, [], `${nome} tem UUID gravado`);
      for (const secao of ['Propósito:', 'Uso:', 'Risco:']) assert.ok(texto.includes(secao), `${nome} sem "${secao}"`);
      assert.match(texto, /\\set ON_ERROR_STOP on/, `${nome} sem ON_ERROR_STOP`);
    }
  });

  test('scripts que alteram o banco: transação, ensaio por padrão e sem CASCADE', () => {
    for (const nome of ['drop_unified_comm.sql', 'recreate_unified_comm.sql', 'recreate_data_health_view.sql']) {
      const texto = ler(nome);
      assert.match(texto, /^BEGIN;$/m);
      assert.match(texto, /\\if :aplicar_ok\n(.*\n)*?\s*COMMIT;\n(.*\n)*?\\else\n\s*ROLLBACK;/);
      assert.doesNotMatch(texto.replace(/^--.*$/gm, ''), /CASCADE/i);
      assert.match(texto, /SET LOCAL lock_timeout/);
    }
  });

  test('recreate_data_health_view.sql traz a MESMA definição da migration vigente', () => {
    const extrair = (texto) => texto.match(/CREATE OR REPLACE VIEW public\.vw_singu_data_health[\s\S]*?FROM metrics CROSS JOIN scores;/)[0];
    assert.equal(extrair(ler('recreate_data_health_view.sql')), extrair(readFileSync(MIGRATION_VIEW, 'utf8')));
  });
});

describe('SQL da raiz: execução em Postgres', { skip: disponibilidade.ok ? false : disponibilidade.motivo }, () => {
  let banco;
  const alvo = () => ({ banco });
  const rodar = (nome, variaveis = {}, extras = []) => rodarArquivo(path.join(AQUI, nome), alvo(), variaveis, extras);
  const existe = (assinatura) => sql(`SELECT to_regprocedure('${FN}(${assinatura})') IS NOT NULL`, alvo()) === 't';
  const ok = (r, trecho) => { assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`); if (trecho) assert.ok(r.stdout.includes(trecho), r.stdout); };
  const falha = (r, padrao) => { assert.equal(r.status, 3, `${r.stdout}\n${r.stderr}`); assert.match(r.stderr, padrao); };

  function montarBase() {
    sql(`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;
         CREATE TABLE profiles(id uuid PRIMARY KEY, full_name text, email text);
         CREATE TABLE interactions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text, channel text, resumo text,
           content text, data_interacao timestamptz, user_id uuid, company_id uuid);
         CREATE TABLE companies(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, cnpj text);
         CREATE TABLE contacts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, deleted_at timestamptz);
         CREATE TABLE compatibility_settings(id int); CREATE TABLE health_alert_settings(id int); CREATE TABLE automation_rules(id int);
         INSERT INTO profiles VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'Ana Teste', 'ana@exemplo.test');
         INSERT INTO interactions(type, channel, resumo, content, data_interacao, user_id, company_id) VALUES
           ('call', 'phone', 'primeira', NULL, '2026-01-01', 'aaaaaaaa-0000-4000-8000-000000000001', '${EMPRESA}'),
           ('email', 'email', NULL, 'segunda; com ponto e vírgula', '2026-02-01', NULL, '${EMPRESA}'),
           ('note', 'whatsapp', 'terceira', NULL, '2026-03-01', NULL, '${EMPRESA}'),
           ('note', 'whatsapp', 'de outra empresa', NULL, '2026-04-01', NULL, gen_random_uuid());
         INSERT INTO companies(user_id, cnpj) VALUES (gen_random_uuid(), '1'), (NULL, '');
         INSERT INTO contacts(user_id) VALUES (gen_random_uuid());`, alvo());
  }

  before(() => { banco = criarBanco('sqlraiz'); garantirRolesSupabase(); });
  after(() => { if (banco) removerBanco(banco); });

  test('função ausente: check/get/test acusam com mensagem clara', () => {
    montarBase();
    falha(rodar('check_unified_comm.sql'), /FATAL: public\.get_unified_communication_history nao existe/);
    falha(rodar('get_unified_def.sql'), /FATAL: .*nao existe neste banco/);
    falha(rodar('test_unified_comm.sql', { company_id: EMPRESA }), /FATAL: .*nao existe/);
    falha(rodar('test_unified_comm2.sql'), /FATAL: .*nao existe/);
  });

  test('recreate: ensaio não grava; aplicar=1 grava no contrato e é idempotente', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql'), 'ENSAIO:');
    assert.equal(existe('uuid, integer'), false);
    ok(rodar('recreate_unified_comm.sql', { aplicar: 'nao' }), 'ENSAIO:');
    assert.equal(existe('uuid, integer'), false);
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }), 'APLICADO:');
    assert.equal(existe('uuid, integer'), true);
    ok(rodar('check_unified_comm.sql'), 'OK check_unified_comm.');
    const oid = sql(`SELECT '${FN}(uuid, integer)'::regprocedure::oid`, alvo());
    ok(rodar('recreate_unified_comm.sql', { aplicar: 'sim' }), 'APLICADO:');
    assert.equal(sql(`SELECT '${FN}(uuid, integer)'::regprocedure::oid`, alvo()), oid, 'CREATE OR REPLACE deve preservar o objeto');
    const acl = sql(`SELECT concat_ws(',', has_function_privilege('anon', '${FN}(uuid, integer)', 'EXECUTE'),
      has_function_privilege('authenticated', '${FN}(uuid, integer)', 'EXECUTE'),
      has_function_privilege('service_role', '${FN}(uuid, integer)', 'EXECUTE'),
      has_function_privilege('public', '${FN}(uuid, integer)', 'EXECUTE'))`, alvo());
    assert.equal(acl, 'f,t,t,f');
  });

  test('recreate: avisa o PostgREST só quando aplica', () => {
    montarBase();
    const ensaio = rodar('recreate_unified_comm.sql', {}, ['-c', 'LISTEN pgrst']);
    assert.doesNotMatch(ensaio.stdout + ensaio.stderr, /Asynchronous notification "pgrst"/);
    const aplicado = rodar('recreate_unified_comm.sql', { aplicar: 1 }, ['-c', 'LISTEN pgrst']);
    assert.match(aplicado.stdout + aplicado.stderr, /Asynchronous notification "pgrst" with payload "reload schema"/);
  });

  test('recreate: remove a sobrecarga legada e troca retorno divergente', () => {
    montarBase();
    sql(`CREATE FUNCTION ${FN}(p_company_id uuid, p_limit integer DEFAULT 50) RETURNS jsonb LANGUAGE sql AS $$ SELECT '[]'::jsonb $$;
         CREATE FUNCTION ${FN}(a uuid, b uuid, c text, d integer) RETURNS int LANGUAGE sql AS 'select 1';
         GRANT EXECUTE ON FUNCTION ${FN}(uuid, integer) TO anon;`, alvo());
    falha(rodar('check_unified_comm.sql'), /2 sobrecargas[\s\S]*retorno: jsonb[\s\S]*EXECUTE concedido a (PUBLIC|anon)/);
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }), 'APLICADO:');
    assert.equal(existe('uuid, uuid, text, integer'), false);
    ok(rodar('check_unified_comm.sql'), 'OK check_unified_comm.');
  });

  test('recreate: coluna ou role ausente aborta sem alterar nada', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    const antes = sql(`SELECT md5(pg_get_functiondef('${FN}(uuid, integer)'::regprocedure))`, alvo());
    sql(`CREATE FUNCTION ${FN}(a uuid, b uuid, c text, d integer) RETURNS int LANGUAGE sql AS 'select 1';
         ALTER TABLE interactions RENAME COLUMN resumo TO resumo_antigo;`, alvo());
    falha(rodar('recreate_unified_comm.sql', { aplicar: 1 }), /FATAL: colunas necessarias ausentes em public: interactions\.resumo/);
    assert.equal(existe('uuid, uuid, text, integer'), true, 'a transação deve ter sido desfeita');
    assert.equal(sql(`SELECT md5(pg_get_functiondef('${FN}(uuid, integer)'::regprocedure))`, alvo()), antes);
  });

  test('check: acusa EXECUTE para anon e authenticated sem acesso', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    sql(`GRANT EXECUTE ON FUNCTION ${FN}(uuid, integer) TO anon;`, alvo());
    falha(rodar('check_unified_comm.sql'), /EXECUTE concedido a anon/);
    sql(`REVOKE EXECUTE ON FUNCTION ${FN}(uuid, integer) FROM anon, authenticated;`, alvo());
    falha(rodar('check_unified_comm.sql'), /authenticated sem EXECUTE/);
  });

  test('test_unified_comm: exige company_id válido, respeita limite e não é injetável', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    falha(rodar('test_unified_comm.sql'), /FATAL: informe a empresa: psql -v company_id=<uuid>/);
    falha(rodar('test_unified_comm.sql', { company_id: 'abc' }), /FATAL: informe a empresa/);
    falha(rodar('test_unified_comm.sql', { company_id: "x'; DROP TABLE interactions; --" }), /FATAL: informe a empresa/);
    falha(rodar('test_unified_comm.sql', { company_id: EMPRESA, limite: '1; DROP TABLE interactions' }), /FATAL: -v limite/);
    assert.equal(sql('SELECT count(*) FROM interactions', alvo()), '4');
    const tudo = rodar('test_unified_comm.sql', { company_id: EMPRESA }, ['-At']);
    ok(tudo);
    const linhas = tudo.stdout.trim().split('\n');
    assert.equal(linhas.length, 3);
    assert.match(linhas[0], /\|note\|whatsapp\|terceira\|2026-03-01.*\|Sistema$/);
    assert.match(linhas[1], /\|email\|email\|segunda; com ponto e vírgula\|/);
    assert.match(linhas[2], /\|call\|phone\|primeira\|.*\|Ana Teste$/);
    assert.equal(rodar('test_unified_comm.sql', { company_id: EMPRESA, limite: 2 }, ['-At']).stdout.trim().split('\n').length, 2);
  });

  test('test_unified_comm2: passa no contrato e FALHA (código 3) quando a função quebra', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    const neutro = rodar('test_unified_comm2.sql');
    ok(neutro, 'OK test_unified_comm2.');
    assert.match(neutro.stderr, /OK test_unified_comm2: 0 linha\(s\) com p_limit=50, 0 com p_limit=1/);
    assert.match(rodar('test_unified_comm2.sql', { company_id: EMPRESA }).stderr, /3 linha\(s\) com p_limit=50, 1 com p_limit=1/);
    falha(rodar('test_unified_comm2.sql', { company_id: 'nao-e-uuid' }), /FATAL: -v company_id deve ser um UUID/);
    // ordem errada
    sql(`CREATE OR REPLACE FUNCTION ${FN}(p_company_id uuid, p_limit integer DEFAULT 50)
           RETURNS TABLE(interaction_id uuid, interaction_type text, channel text, summary text, interaction_date timestamptz, user_name text)
           LANGUAGE sql STABLE AS $$ SELECT i.id, i.type, i.channel, i.resumo, i.data_interacao, 'x'::text FROM interactions i
             WHERE i.company_id = p_company_id ORDER BY i.data_interacao ASC LIMIT p_limit $$;`, alvo());
    falha(rodar('test_unified_comm2.sql', { company_id: EMPRESA }), /FATAL: \d+ linha\(s\) fora da ordem/);
    // corpo quebrado em tempo de execução: a versão antiga saía com 0 aqui
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    sql('ALTER TABLE interactions DROP COLUMN content;', alvo());
    falha(rodar('test_unified_comm2.sql'), /FATAL: a chamada falhou: 42703/);
    // colunas de retorno fora do contrato
    sql(`DROP FUNCTION ${FN}(uuid, integer);
         CREATE FUNCTION ${FN}(p_company_id uuid, p_limit integer) RETURNS TABLE(id uuid, resumo text) LANGUAGE sql AS 'select null::uuid, null::text';`, alvo());
    falha(rodar('test_unified_comm2.sql'), /FATAL: colunas de retorno fora do contrato/);
  });

  test('get_unified_def: mostra a definição completa de cada sobrecarga', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    const r = rodar('get_unified_def.sql');
    ok(r, 'CREATE OR REPLACE FUNCTION public.get_unified_communication_history');
    assert.match(r.stdout, /seguranca\s*\|\s*SECURITY INVOKER/);
    assert.match(r.stdout, /configuracao\s*\|\s*search_path=public/);
    assert.match(r.stdout, /volatilidade\s*\|\s*STABLE/);
  });

  test('drop: ensaio preserva; aplicar=1 remove; idempotente', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    sql(`CREATE FUNCTION ${FN}(a uuid, b uuid, c text, d integer) RETURNS int LANGUAGE sql AS 'select 1';`, alvo());
    ok(rodar('drop_unified_comm.sql'), 'ENSAIO:');
    assert.equal(existe('uuid, integer') && existe('uuid, uuid, text, integer'), true);
    ok(rodar('drop_unified_comm.sql', { aplicar: 1 }), 'APLICADO:');
    assert.equal(existe('uuid, integer') || existe('uuid, uuid, text, integer'), false);
    ok(rodar('drop_unified_comm.sql', { aplicar: 1 }), 'APLICADO:');
  });

  test('drop: dependência ou sobrecarga desconhecida aborta sem remover nada', () => {
    montarBase();
    ok(rodar('recreate_unified_comm.sql', { aplicar: 1 }));
    sql(`CREATE VIEW vw_dependente AS SELECT * FROM ${FN}('00000000-0000-0000-0000-000000000000'::uuid, 1);`, alvo());
    const dep = rodar('drop_unified_comm.sql', { aplicar: 1 });
    assert.equal(dep.status, 3);
    assert.match(dep.stderr, /cannot drop function .* because other objects depend on it/);
    assert.equal(existe('uuid, integer'), true);
    sql(`DROP VIEW vw_dependente; CREATE FUNCTION ${FN}(x text) RETURNS int LANGUAGE sql AS 'select 1';`, alvo());
    falha(rodar('drop_unified_comm.sql', { aplicar: 1 }), /FATAL: sobrecarga desconhecida ainda existe \(get_unified_communication_history\(text\)\)/);
    assert.equal(existe('uuid, integer'), true, 'o DROP parcial deve ter sido desfeito');
  });

  test('view de saúde: ensaio não grava; aplicar=1 cria igual à migration, com permissões e idempotente', () => {
    montarBase();
    ok(rodar('recreate_data_health_view.sql'), 'ENSAIO:');
    assert.equal(sql("SELECT to_regclass('public.vw_singu_data_health') IS NULL", alvo()), 't');
    ok(rodar('recreate_data_health_view.sql', { aplicar: 1 }), 'APLICADO:');
    const definicao = () => sql("SELECT md5(pg_get_viewdef('public.vw_singu_data_health'::regclass, true))", alvo());
    const peloScript = definicao();
    assert.equal(sql("SELECT reloptions::text FROM pg_class WHERE oid = 'public.vw_singu_data_health'::regclass", alvo()), '{security_invoker=true}');
    assert.equal(sql(`SELECT concat_ws(',', has_table_privilege('anon', 'public.vw_singu_data_health', 'SELECT'),
      has_table_privilege('authenticated', 'public.vw_singu_data_health', 'SELECT'),
      has_table_privilege('service_role', 'public.vw_singu_data_health', 'SELECT'))`, alvo()), 'f,t,t');
    assert.match(sql('SELECT health_score::text FROM public.vw_singu_data_health', alvo()), /^\d+(\.\d)?$/);
    ok(rodar('recreate_data_health_view.sql', { aplicar: 1 }), 'APLICADO:');
    assert.equal(definicao(), peloScript);
    // a migration vigente, rodada de verdade, produz exatamente a mesma view
    sql('DROP VIEW public.vw_singu_data_health;', alvo());
    ok(rodarArquivo(MIGRATION_VIEW, alvo(), {}, ['-v', 'ON_ERROR_STOP=1']));
    assert.equal(definicao(), peloScript);
  });

  test('view de saúde: tabela-fonte ausente ou view incompatível aborta sem alterar', () => {
    montarBase();
    sql('DROP TABLE automation_rules;', alvo());
    falha(rodar('recreate_data_health_view.sql', { aplicar: 1 }), /FATAL: tabelas-fonte ausentes em public: automation_rules/);
    sql('CREATE TABLE automation_rules(id int); CREATE VIEW vw_singu_data_health AS SELECT 1 AS coluna_antiga;', alvo());
    const r = rodar('recreate_data_health_view.sql', { aplicar: 1 });
    assert.equal(r.status, 3);
    assert.equal(sql("SELECT string_agg(attname, ',') FROM pg_attribute WHERE attrelid = 'public.vw_singu_data_health'::regclass AND attnum > 0", alvo()), 'coluna_antiga');
  });

  test('explain-top-queries: sem a extensão (ou sem carregá-la) falha com mensagem clara', () => {
    montarBase();
    if (sql("SELECT count(*) FROM pg_extension WHERE extname = 'pg_stat_statements'", alvo()) === '0') {
      falha(rodar('explain-top-queries.sql'), /pg_stat_statements indisponivel: extensao nao instalada/);
    }
    falha(rodar('explain-top-queries.sql', { top: 'abc' }), /parametro invalido: -v top=abc/);
    falha(rodar('explain-top-queries.sql', { top: 0 }), /parametro invalido/);
    const preload = sql('SHOW shared_preload_libraries', alvo());
    if (!preload.includes('pg_stat_statements') && sql("SELECT count(*) FROM pg_available_extensions WHERE name = 'pg_stat_statements'", alvo()) === '1') {
      sql('CREATE EXTENSION IF NOT EXISTS pg_stat_statements;', alvo());
      falha(rodar('explain-top-queries.sql'), /pg_stat_statements indisponivel: .*shared_preload_libraries/);
    }
  });
});

const efemero = disponibilidade.ok ? clusterEfemero({ tls: false }) : { ok: false, motivo: disponibilidade.motivo };

describe('explain-top-queries.sql com pg_stat_statements carregado', { skip: efemero.ok ? false : efemero.motivo }, () => {
  const alvo = () => ({ ...efemero.alvo, banco: 'postgres' });
  const rodar = (variaveis = {}, extras = ['--csv']) => rodarArquivo(path.join(AQUI, 'explain-top-queries.sql'), alvo(), variaveis, extras);
  after(() => efemero.parar());

  test('ranking real: colunas estáveis, comentário inicial tolerado, utilitário com segredo fora, banco atual só', () => {
    sql(`CREATE SCHEMA extensions; CREATE EXTENSION pg_stat_statements WITH SCHEMA extensions; CREATE DATABASE g3_outro;
         SELECT extensions.pg_stat_statements_reset();`, alvo());
    sql(`/* app */ SELECT 4242 AS marcador_g3, pg_sleep(0.05);
         CREATE ROLE g3_role_tmp; ALTER ROLE g3_role_tmp PASSWORD 'segredo_g3_nao_pode_vazar'; DROP ROLE g3_role_tmp;`, alvo());
    sql('SELECT 777 AS de_outro_banco_g3, pg_sleep(0.05);', { ...alvo(), banco: 'g3_outro' });
    const r = rodar({ top: 50 });
    assert.equal(r.status, 0, r.stderr);
    const linhas = r.stdout.trim().split('\n');
    assert.equal(linhas[0], 'short_query,total_time,calls,mean_time,percentage_of_load,queryid');
    assert.ok(linhas.some((l) => l.includes('marcador_g3')), r.stdout);
    assert.doesNotMatch(r.stdout, /segredo_g3|PASSWORD|de_outro_banco_g3/);
    assert.equal(rodar({ top: 1 }).stdout.trim().split('\n').length, 2);
    assert.match(rodar({}, []).stdout, /short_query\s*\|\s*total_time/); // sem -v top: padrão 20, formato de tabela
  });
});
