-- index-corruption-amcheck.sql — Rodada 21/10
-- Proposito: falha se algum indice btree de public esta corrompido (bt_index_check).
-- Classe   : GUARD FATAL
-- Limiar   : qualquer indice reprovado entre os :max_indices primeiros (default 100).
-- Variaveis: -v max_indices=100
-- Saida    : 0 = ok ou SKIP; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Requer   : extensao amcheck (em qualquer schema) e EXECUTE em bt_index_check.
--            Sem a extensao ou sem privilegio: SKIP com NOTICE (passa).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_indices}
\else
  \set max_indices 100
\endif
SELECT set_config('guard.max_indices', :'max_indices', false) AS _cfg \gset
\echo '== index-corruption-amcheck =='
DO $$
DECLARE
  v_schema text;
  v_idx record;
  v_failed int := 0;
  v_lim int := current_setting('guard.max_indices')::int;
BEGIN
  SELECT n.nspname INTO v_schema
    FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'amcheck';
  IF v_schema IS NULL THEN
    RAISE NOTICE 'SKIP: amcheck nao instalado (CREATE EXTENSION amcheck para habilitar).';
    RETURN;
  END IF;
  FOR v_idx IN
    SELECT c.oid::regclass::text AS idx
      FROM pg_class c JOIN pg_index i ON i.indexrelid=c.oid
      JOIN pg_am am ON am.oid=c.relam
     WHERE am.amname='btree' AND c.relnamespace = 'public'::regnamespace
       AND c.relkind = 'i'
       AND i.indisvalid AND i.indisready
     ORDER BY c.oid
     LIMIT v_lim
  LOOP
    BEGIN
      EXECUTE format('SELECT %I.bt_index_check(%L::regclass, true)', v_schema, v_idx.idx);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'SKIP: sem EXECUTE em bt_index_check (%).', SQLERRM;
        RETURN;
      WHEN OTHERS THEN
        RAISE WARNING 'CORRUPT: % — %', v_idx.idx, SQLERRM;
        v_failed := v_failed + 1;
    END;
  END LOOP;
  IF v_failed > 0 THEN
    RAISE EXCEPTION 'FATAL: % indices btree corrompidos. REINDEX urgente.', v_failed;
  END IF;
END $$;
\echo 'OK sem indices btree corrompidos (ou verificacao pulada — ver NOTICE).'
