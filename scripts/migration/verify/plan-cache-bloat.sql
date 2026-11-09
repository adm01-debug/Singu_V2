-- plan-cache-bloat.sql — Rodada 25/10 (WARN)
-- Proposito: alta taxa de replan (plans/calls) indica invalidacao de plan cache ou
--            prepared statements mal parametrizados; custa CPU e latencia.
-- Classe   : AUDIT (RAISE WARNING no achado; nunca falha)
-- Limiar   : query com calls >= :min_calls (default 100) e plans/calls > :max_replan (default 0.5).
-- Variaveis: -v min_calls=100 -v max_replan=0.5
-- Saida    : 0 (inclusive SKIP).
-- Requer   : pg_stat_statements instalado, carregado e com track_planning=on (senao plans=0).
--            Indisponivel: SKIP com NOTICE.
\set ON_ERROR_STOP on
\pset pager off
\if :{?min_calls}
\else
  \set min_calls 100
\endif
\if :{?max_replan}
\else
  \set max_replan 0.5
\endif
SELECT set_config('guard.min_calls', :'min_calls', false) AS _cfg1,
       set_config('guard.max_replan', :'max_replan', false) AS _cfg2,
       set_config('guard.pgss', '', false) AS _cfg3 \gset
\echo '== plan-cache-bloat =='
-- Sonda: descobre o schema da extensao e confirma que a view responde (biblioteca carregada).
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
SELECT queryid, calls, plans,
       ROUND((plans::numeric / NULLIF(calls,0)) * 100, 2) AS replan_pct,
       ROUND(mean_exec_time::numeric, 2) AS mean_ms,
       LEFT(regexp_replace(query,'\s+',' ','g'), 100) AS q
  FROM :pgss.pg_stat_statements
 WHERE calls >= (:'min_calls')::numeric
   AND plans::numeric / NULLIF(calls,0) > (:'max_replan')::numeric
 ORDER BY plans DESC
 LIMIT 20;
DO $$
DECLARE v_bad int;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s.pg_stat_statements
                   WHERE calls >= $1 AND plans::numeric / NULLIF(calls,0) > $2',
                 current_setting('guard.pgss'))
    INTO v_bad
    USING current_setting('guard.min_calls')::numeric, current_setting('guard.max_replan')::numeric;
  IF v_bad > 0 THEN
    RAISE WARNING '% queries com replan rate acima do limiar. Revisar prepared statements.', v_bad;
  END IF;
END $$;
\endif
\echo 'OK plan cache auditado (ou verificacao pulada — ver NOTICE).'
