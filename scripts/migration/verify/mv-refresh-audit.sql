-- mv-refresh-audit.sql — Detecta MVs stale (>24h) e sem cron REFRESH correspondente.
-- Classe   : AUDIT (RAISE WARNING no achado; nunca falha)
-- Limiar   : MV de public sem job pg_cron contendo "REFRESH MATERIALIZED VIEW ... <nome>";
--            "stale" = sem ANALYZE/autoanalyze ha mais de :max_horas horas (aproximacao
--            do ultimo REFRESH; o Postgres nao guarda a data do refresh).
-- Variaveis: -v max_horas=24
-- Saida    : 0.
-- Requer   : pg_cron para o cruzamento com jobs. Ausente: lista as MVs e pula o cruzamento.
-- Uso: psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f verify/mv-refresh-audit.sql
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_horas}
\else
  \set max_horas 24
\endif
SELECT to_regclass('cron.job') IS NOT NULL AS tem_cron \gset

\if :tem_cron
WITH mvs AS (
  SELECT n.nspname || '.' || c.relname AS mv_name,
         c.relname AS mv_relname,
         GREATEST(COALESCE(s.last_analyze, 'epoch'::timestamptz),
                  COALESCE(s.last_autoanalyze, 'epoch'::timestamptz)) AS last_touch
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
   WHERE c.relkind = 'm' AND n.nspname = 'public'
),
crons AS (
  SELECT jobname, command FROM cron.job
   WHERE command ILIKE '%REFRESH MATERIALIZED VIEW%'
),
matched AS (
  SELECT m.mv_name, m.last_touch,
         EXISTS (SELECT 1 FROM crons c WHERE strpos(lower(c.command), lower(m.mv_relname)) > 0) AS has_cron,
         EXTRACT(EPOCH FROM (now() - m.last_touch))/3600 AS hours_since
    FROM mvs m
)
SELECT mv_name,
       ROUND(hours_since::numeric, 1) AS hours_since_refresh,
       has_cron,
       CASE WHEN NOT has_cron THEN 'NO_CRON'
            WHEN hours_since > (:'max_horas')::numeric THEN 'STALE'
            ELSE 'OK' END AS status
  FROM matched
 ORDER BY has_cron ASC, hours_since DESC;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE c.relkind = 'm' AND n.nspname = 'public'
     AND NOT EXISTS (
       SELECT 1 FROM cron.job j
        WHERE j.command ILIKE '%REFRESH MATERIALIZED VIEW%'
          AND strpos(lower(j.command), lower(c.relname)) > 0
     );
  IF v_bad > 0 THEN
    RAISE WARNING '⚠ % MV(s) sem cron REFRESH correspondente', v_bad;
  ELSE
    RAISE NOTICE '✔ Todas MVs com cron REFRESH mapeado';
  END IF;
END
$BODY$;
\else
SELECT n.nspname || '.' || c.relname AS mv_name,
       ROUND((EXTRACT(EPOCH FROM (now() - GREATEST(COALESCE(s.last_analyze, 'epoch'::timestamptz),
                  COALESCE(s.last_autoanalyze, 'epoch'::timestamptz))))/3600)::numeric, 1) AS hours_since_refresh
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
 WHERE c.relkind = 'm' AND n.nspname = 'public'
 ORDER BY 2 DESC;
\echo 'NOTICE: SKIP pg_cron nao instalado — cruzamento MV x cron REFRESH pulado.'
\endif
