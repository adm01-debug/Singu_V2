\pset pager off
BEGIN;
\i supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql
CREATE EXTENSION IF NOT EXISTS plpgsql_check;
SET LOCAL statement_timeout = '600s';
CREATE TEMP TABLE chk AS
SELECT p.oid::regprocedure::text AS fn, NULL::text AS rel, r.lineno, r.sqlstate, r.message
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang,
  LATERAL plpgsql_check_function_tb(p.oid, fatal_errors => false, other_warnings => false, extra_warnings => false, performance_warnings => false) r
 WHERE n.nspname='public' AND l.lanname='plpgsql' AND p.prorettype <> 'trigger'::regtype AND r.level='error';
INSERT INTO chk
SELECT DISTINCT ON (p.oid, r.lineno, r.message) p.oid::regprocedure::text, t.tgrelid::regclass::text, r.lineno, r.sqlstate, r.message
  FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang,
  LATERAL plpgsql_check_function_tb(p.oid, t.tgrelid, fatal_errors => false, other_warnings => false, extra_warnings => false, performance_warnings => false) r
 WHERE NOT t.tgisinternal AND n.nspname='public' AND l.lanname='plpgsql' AND r.level='error';
SELECT count(DISTINCT fn) AS funcoes_com_erro, count(*) AS erros FROM chk;
SELECT sqlstate, count(DISTINCT fn) FROM chk GROUP BY 1 ORDER BY 2 DESC;
\pset format unaligned
\pset tuples_only on
SELECT 'ERR|'||fn||'|'||coalesce(rel,'')||'|'||lineno||'|'||sqlstate||'|'||message
       ||'|trg='||coalesce((SELECT string_agg(DISTINCT t.tgname||'@'||t.tgrelid::regclass||':'||t.tgenabled, ',') FROM pg_trigger t WHERE t.tgfoid = to_regprocedure(fn)),'')
       ||'|anon='||has_function_privilege('anon', to_regprocedure(fn), 'EXECUTE')||'|auth='||has_function_privilege('authenticated', to_regprocedure(fn), 'EXECUTE')
       ||'|cron='||coalesce((SELECT string_agg(j.jobname, ',') FROM cron.job j WHERE j.command ILIKE '%'||split_part(fn,'(',1)||'%' AND j.active),'')
  FROM chk ORDER BY fn, lineno;
ROLLBACK;
