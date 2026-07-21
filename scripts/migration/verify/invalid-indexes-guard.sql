-- invalid-indexes-guard.sql — Falha se houver indice invalido em public.*
-- (indisvalid=false / indisready=false). Planner ignora esses indices -> regressao silenciosa.
\set ON_ERROR_STOP on
\pset pager off

SELECT n.nspname AS schema, c.relname AS index_name, t.relname AS table_name,
       i.indisvalid, i.indisready, i.indislive
  FROM pg_index i
  JOIN pg_class c ON c.oid = i.indexrelid
  JOIN pg_class t ON t.oid = i.indrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND (NOT i.indisvalid OR NOT i.indisready OR NOT i.indislive)
 ORDER BY t.relname, c.relname;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND (NOT i.indisvalid OR NOT i.indisready OR NOT i.indislive);
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'INVALID INDEX: % indice(s) invalidos em public.* - REINDEX necessario', v_bad;
  END IF;
  RAISE NOTICE 'OK Todos indices public.* validos';
END
$BODY$;