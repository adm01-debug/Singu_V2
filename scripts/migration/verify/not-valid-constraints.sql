-- not-valid-constraints.sql — Detecta constraints NOT VALID esquecidas.
\set ON_ERROR_STOP on
\pset pager off

SELECT n.nspname || '.' || c.conname AS constraint_name,
       t.relname AS table_name, c.contype
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
 WHERE n.nspname = 'public' AND NOT c.convalidated
 ORDER BY t.relname;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
   WHERE n.nspname = 'public' AND NOT c.convalidated;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'NOT VALID: % constraint(s) sem VALIDATE', v_bad;
  END IF;
  RAISE NOTICE 'OK Todas constraints validadas';
END
$BODY$;