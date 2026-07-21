-- Sequence Gap Auto-Heal — realinha todas as sequences pós-import paralelo.
-- Uso: psql "$DEST_DB_URL" -f sql/heal-sequences.sql
\set ON_ERROR_STOP on

DO $$
DECLARE
  r RECORD;
  seq_name text;
  max_id bigint;
  fixed int := 0;
  skipped int := 0;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema, c.relname AS tbl, a.attname AS col
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
     WHERE c.relkind = 'r'
       AND n.nspname IN ('public','auth')
       AND pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) IS NOT NULL
  LOOP
    seq_name := pg_get_serial_sequence(format('%I.%I', r.schema, r.tbl), r.col);
    BEGIN
      EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I.%I', r.col, r.schema, r.tbl) INTO max_id;
      IF max_id > 0 THEN
        PERFORM setval(seq_name, max_id + 1, false);
        RAISE NOTICE '✔ %.%.% → setval(%, %)', r.schema, r.tbl, r.col, seq_name, max_id + 1;
        fixed := fixed + 1;
      ELSE
        skipped := skipped + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠ %.%.% falhou: %', r.schema, r.tbl, r.col, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE 'Sequences realinhadas: fixed=% skipped=%', fixed, skipped;
END $$;