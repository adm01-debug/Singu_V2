-- autovacuum-audit.sql — Sinaliza tabelas public.* com autovacuum DESLIGADO.
\set ON_ERROR_STOP on
\pset pager off

SELECT n.nspname || '.' || c.relname AS table_name, c.reloptions
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND c.reloptions::text ILIKE '%autovacuum_enabled=false%'
 ORDER BY 1;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND c.reloptions::text ILIKE '%autovacuum_enabled=false%';
  IF v_bad > 0 THEN
    RAISE WARNING '% tabela(s) com autovacuum desligado - risco de bloat', v_bad;
  ELSE
    RAISE NOTICE 'OK Autovacuum habilitado em todas as tabelas public.*';
  END IF;
END
$BODY$;