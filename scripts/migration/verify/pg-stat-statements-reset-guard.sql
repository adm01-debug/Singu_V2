-- pg-stat-statements-reset-guard.sql — Rodada 24/10 (gap 22)
-- Reset de pg_stat_statements durante janela de observacao apaga historico e
-- invalida diffs de plan regression pre/pos migracao.
\echo '== pg-stat-statements-reset-guard =='
SELECT stats_reset, now() - stats_reset AS since_reset
  FROM pg_stat_statements_info;
DO $$
DECLARE v_since interval;
BEGIN
  SELECT now() - stats_reset INTO v_since FROM pg_stat_statements_info;
  IF v_since < interval '1 hour' THEN
    RAISE WARNING 'pg_stat_statements resetado ha %; diffs de plano podem estar incompletos.', v_since;
  END IF;
END $$;
\echo 'OK pg_stat_statements com janela util.'