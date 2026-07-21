-- tables-without-pk.sql — Detecta tabelas sem PRIMARY KEY.
\set ON_ERROR_STOP on
\pset pager off

SELECT n.nspname || '.' || c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public' AND c.relkind = 'r'
   AND NOT EXISTS (
     SELECT 1 FROM pg_constraint pk
      WHERE pk.conrelid = c.oid AND pk.contype = 'p'
   )
 ORDER BY 1;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND NOT EXISTS (SELECT 1 FROM pg_constraint pk
                      WHERE pk.conrelid = c.oid AND pk.contype = 'p');
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'MISSING PK: % tabela(s) sem PK - logical replication quebra', v_bad;
  END IF;
  RAISE NOTICE 'OK Todas tabelas com PK';
END
$BODY$;