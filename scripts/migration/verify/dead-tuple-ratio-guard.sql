-- dead-tuple-ratio-guard.sql — Rodada 22/10
-- Proposito: falha se tabelas grandes acumulam dead tuples (VACUUM nao acompanha).
-- Classe   : GUARD FATAL
-- Limiar   : tabela com mais de :min_linhas tuplas (default 100000) e dead > :max_pct % (default 40).
--            A listagem informativa usa 1/10 de :min_linhas e metade de :max_pct.
-- Variaveis: -v min_linhas=100000 -v max_pct=40
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Fonte    : pg_stat_user_tables (estimativa; depende de track_counts=on).
\set ON_ERROR_STOP on
\pset pager off
\if :{?min_linhas}
\else
  \set min_linhas 100000
\endif
\if :{?max_pct}
\else
  \set max_pct 40
\endif
SELECT set_config('guard.min_linhas', :'min_linhas', false) AS _cfg1,
       set_config('guard.max_pct', :'max_pct', false) AS _cfg2 \gset
\echo '== dead-tuple-ratio-guard =='
SELECT schemaname, relname,
       n_live_tup, n_dead_tup,
       ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
       last_autovacuum, last_vacuum
  FROM pg_stat_user_tables
 WHERE (n_live_tup + n_dead_tup) > (:'min_linhas')::numeric / 10
   AND (100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0)) > (:'max_pct')::numeric / 2
 ORDER BY dead_pct DESC
 LIMIT 30;
DO $$
DECLARE
  v_count int;
  v_min numeric := current_setting('guard.min_linhas')::numeric;
  v_pct numeric := current_setting('guard.max_pct')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_stat_user_tables
   WHERE (n_live_tup + n_dead_tup) > v_min
     AND (100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0)) > v_pct;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % tabelas grandes com > % pct dead tuples. VACUUM urgente.', v_count, v_pct;
  END IF;
END $$;
\echo 'OK dead tuple ratio saudavel.'
