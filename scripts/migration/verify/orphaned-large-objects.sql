-- orphaned-large-objects.sql — Rodada 25/10 (FATAL)
-- Large objects (pg_largeobject_metadata) sem referencia em nenhuma coluna oid
-- ficam retidos indefinidamente e podem inchar o cluster.
\echo '== orphaned-large-objects =='
DO $$
DECLARE
  v_col record;
  v_refs oid[] := ARRAY[]::oid[];
  v_batch oid[];
  v_orphans bigint;
BEGIN
  FOR v_col IN
    SELECT n.nspname, c.relname, a.attname
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_type t ON t.oid = a.atttypid
     WHERE c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
       AND t.typname = 'oid'
       AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
  LOOP
    BEGIN
      EXECUTE format('SELECT array_agg(DISTINCT %I) FROM %I.%I WHERE %I IS NOT NULL',
                     v_col.attname, v_col.nspname, v_col.relname, v_col.attname)
        INTO v_batch;
      IF v_batch IS NOT NULL THEN
        v_refs := v_refs || v_batch;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
  SELECT count(*) INTO v_orphans
    FROM pg_largeobject_metadata m
   WHERE NOT (m.oid = ANY (v_refs));
  RAISE NOTICE 'Large objects orfaos: %', v_orphans;
  IF v_orphans > 100 THEN
    RAISE EXCEPTION 'FATAL: % large objects orfaos. Rodar vacuumlo.', v_orphans;
  END IF;
END $$;
\echo 'OK large objects sem retencao anomala.'