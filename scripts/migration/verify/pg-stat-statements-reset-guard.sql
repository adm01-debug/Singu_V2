-- pg-stat-statements-reset-guard.sql — Rodada 24/10 (gap 22)
-- Proposito: reset de pg_stat_statements durante a janela de observacao apaga o historico
--            e invalida diffs de plan regression pre/pos migracao.
-- Classe   : GUARD WARN (sai != 0; no full-audit conta como WARN)
-- Limiar   : ultimo reset ha menos de :min_janela_min minutos (default 60).
-- Variaveis: -v min_janela_min=60 (aceita decimal)
-- Saida    : 0 = ok ou SKIP; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Requer   : pg_stat_statements instalado E carregado (shared_preload_libraries), PG14+.
--            Indisponivel: SKIP com NOTICE (passa).
\set ON_ERROR_STOP on
\pset pager off
\if :{?min_janela_min}
\else
  \set min_janela_min 60
\endif
SELECT set_config('guard.min_janela_min', :'min_janela_min', false) AS _cfg \gset
\echo '== pg-stat-statements-reset-guard =='
DO $$
DECLARE
  v_schema text;
  v_reset timestamptz;
  v_min numeric := current_setting('guard.min_janela_min')::numeric;
BEGIN
  SELECT n.nspname INTO v_schema
    FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'pg_stat_statements';
  IF v_schema IS NULL THEN
    RAISE NOTICE 'SKIP: pg_stat_statements nao instalado.';
    RETURN;
  END IF;
  BEGIN
    EXECUTE format('SELECT stats_reset FROM %I.pg_stat_statements_info', v_schema) INTO v_reset;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SKIP: pg_stat_statements indisponivel (%).', SQLERRM;
    RETURN;
  END;
  RAISE NOTICE 'stats_reset=% (ha %)', v_reset, now() - v_reset;
  IF now() - v_reset < v_min * interval '1 minute' THEN
    RAISE EXCEPTION 'WARN: pg_stat_statements resetado ha % (< %min); diffs de plano podem estar incompletos.', now() - v_reset, v_min;
  END IF;
END $$;
\echo 'OK pg_stat_statements com janela util (ou verificacao pulada — ver NOTICE).'
