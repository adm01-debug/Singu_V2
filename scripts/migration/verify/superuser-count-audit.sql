-- superuser-count-audit.sql — Rodada 22/10
-- Proposito: lista roles com SUPERUSER ou BYPASSRLS.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
\set ON_ERROR_STOP on
\pset pager off
\echo '== superuser-count-audit =='
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolreplication, rolbypassrls
  FROM pg_roles
 WHERE rolsuper = true OR rolbypassrls = true
 ORDER BY rolname;
\echo 'REC: minimizar superusers; usar roles com CREATEDB/REPLICATION granular.'