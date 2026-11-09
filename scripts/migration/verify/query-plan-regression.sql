-- query-plan-regression.sql — Baseline das top-30 queries por total_time.
-- Diff pre x pos migracao detecta regressao de plano imediatamente.
-- Classe   : SNAPSHOT (uma linha JSON por query; sem veredito)
-- Variaveis: -v top=30 -v min_calls=10
-- Saida    : 0 (inclusive SKIP: sem pg_stat_statements utilizavel nao imprime linhas).
-- Requer   : pg_stat_statements instalado e carregado. Indisponivel: SKIP com NOTICE (stderr).
\set ON_ERROR_STOP on
\pset pager off
\pset format unaligned
\pset tuples_only on
\if :{?top}
\else
  \set top 30
\endif
\if :{?min_calls}
\else
  \set min_calls 10
\endif
SELECT set_config('guard.pgss', '', false) AS _cfg \gset
DO $$
DECLARE v_schema text;
BEGIN
  SELECT n.nspname INTO v_schema
    FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'pg_stat_statements';
  IF v_schema IS NULL THEN
    RAISE NOTICE 'SKIP: pg_stat_statements nao instalado.';
    RETURN;
  END IF;
  BEGIN
    EXECUTE format('SELECT 1 FROM %I.pg_stat_statements LIMIT 1', v_schema);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'SKIP: pg_stat_statements indisponivel (%).', SQLERRM;
    RETURN;
  END;
  PERFORM set_config('guard.pgss', quote_ident(v_schema), false);
END $$;
SELECT current_setting('guard.pgss') <> '' AS tem_pgss, current_setting('guard.pgss') AS pgss \gset
\if :tem_pgss

SELECT jsonb_build_object(
  'queryid', queryid,
  'calls', calls,
  'mean_ms', ROUND(mean_exec_time::numeric, 2),
  'query_prefix', LEFT(regexp_replace(query, '\s+', ' ', 'g'), 120)
)::text
FROM :pgss.pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
  AND query NOT ILIKE '%EXPLAIN%'
  AND calls >= (:'min_calls')::numeric
ORDER BY total_exec_time DESC
LIMIT (:'top')::int;
\endif
