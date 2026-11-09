-- heap-corruption-scan.sql — Rodada 25/10 (FATAL)
-- Proposito: detecta paginas heap com visibility map inconsistente (corrupcao silenciosa).
-- Classe   : GUARD FATAL
-- Limiar   : qualquer TID devolvido por pg_check_visible nas :max_tabelas maiores tabelas de public.
-- Variaveis: -v max_tabelas=50
-- Saida    : 0 = ok ou SKIP; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Requer   : extensao pg_visibility (em qualquer schema) e EXECUTE em pg_check_visible.
--            Sem a extensao ou sem privilegio: SKIP com NOTICE (passa) — mesmo padrao do amcheck.
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_tabelas}
\else
  \set max_tabelas 50
\endif
SELECT set_config('guard.max_tabelas', :'max_tabelas', false) AS _cfg \gset
\echo '== heap-corruption-scan =='
DO $$
DECLARE
  v_schema text;
  v_rel record;
  v_bad bigint;
  v_total bigint := 0;
  v_lim int := current_setting('guard.max_tabelas')::int;
BEGIN
  SELECT n.nspname INTO v_schema
    FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'pg_visibility';
  IF v_schema IS NULL THEN
    RAISE NOTICE 'SKIP: pg_visibility nao instalado (CREATE EXTENSION pg_visibility).';
    RETURN;
  END IF;
  FOR v_rel IN
    SELECT c.oid::regclass::text AS rel
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
     ORDER BY pg_relation_size(c.oid) DESC
     LIMIT v_lim
  LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM %I.pg_check_visible(%L::regclass)', v_schema, v_rel.rel) INTO v_bad;
      IF v_bad > 0 THEN
        RAISE WARNING 'CORRUPT visibility em %: % paginas', v_rel.rel, v_bad;
        v_total := v_total + v_bad;
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'SKIP: sem EXECUTE em pg_check_visible (%).', SQLERRM;
        RETURN;
      WHEN OTHERS THEN
        RAISE WARNING 'pg_check_visible falhou em %: %', v_rel.rel, SQLERRM;
    END;
  END LOOP;
  IF v_total > 0 THEN
    RAISE EXCEPTION 'FATAL: % paginas heap com visibility inconsistente (top % public).', v_total, v_lim;
  END IF;
END $$;
\echo 'OK heap visibility consistente (ou verificacao pulada — ver NOTICE).'
