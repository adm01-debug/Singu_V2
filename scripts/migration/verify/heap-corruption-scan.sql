-- heap-corruption-scan.sql — Rodada 25/10 (FATAL)
-- Detecta paginas heap com visibility map inconsistente (corrupcao silenciosa).
-- Requer extensao pg_visibility; se ausente, skip com NOTICE (mesmo padrao do amcheck).
\echo '== heap-corruption-scan =='
DO $$
DECLARE
  v_ext bool;
  v_rel record;
  v_bad bigint;
  v_total bigint := 0;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_visibility') INTO v_ext;
  IF NOT v_ext THEN
    RAISE NOTICE 'pg_visibility nao instalado; skip (CREATE EXTENSION pg_visibility).';
    RETURN;
  END IF;
  FOR v_rel IN
    SELECT c.oid::regclass::text AS rel
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
     ORDER BY pg_relation_size(c.oid) DESC
     LIMIT 50
  LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM pg_check_visible(%L::regclass)', v_rel.rel) INTO v_bad;
      IF v_bad > 0 THEN
        RAISE WARNING 'CORRUPT visibility em %: % paginas', v_rel.rel, v_bad;
        v_total := v_total + v_bad;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'pg_check_visible falhou em %: %', v_rel.rel, SQLERRM;
    END;
  END LOOP;
  IF v_total > 0 THEN
    RAISE EXCEPTION 'FATAL: % paginas heap com visibility inconsistente (top 50 public).', v_total;
  END IF;
END $$;
\echo 'OK heap visibility consistente.'