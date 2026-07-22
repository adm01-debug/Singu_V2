-- index-corruption-amcheck.sql — Rodada 21/10
\echo '== index-corruption-amcheck =='
DO $$
DECLARE
  v_ext_exists bool;
  v_idx record;
  v_failed int := 0;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='amcheck') INTO v_ext_exists;
  IF NOT v_ext_exists THEN
    RAISE NOTICE 'amcheck nao instalado; skip (CREATE EXTENSION amcheck para habilitar).';
    RETURN;
  END IF;
  FOR v_idx IN
    SELECT c.oid::regclass::text AS idx
      FROM pg_class c JOIN pg_index i ON i.indexrelid=c.oid
      JOIN pg_am am ON am.oid=c.relam
     WHERE am.amname='btree' AND c.relnamespace = 'public'::regnamespace
       AND i.indisvalid AND i.indisready
     LIMIT 100
  LOOP
    BEGIN
      EXECUTE format('SELECT bt_index_check(%L::regclass, true)', v_idx.idx);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'CORRUPT: % — %', v_idx.idx, SQLERRM;
      v_failed := v_failed + 1;
    END;
  END LOOP;
  IF v_failed > 0 THEN
    RAISE EXCEPTION 'FATAL: % indices btree corrompidos. REINDEX urgente.', v_failed;
  END IF;
END $$;
\echo 'OK sem indices btree corrompidos (top 100 public).'