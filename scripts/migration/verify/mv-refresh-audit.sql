-- mv-refresh-audit.sql — Detecta MVs stale (>24h) e sem cron REFRESH correspondente.
-- Uso: psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f verify/mv-refresh-audit.sql
\set ON_ERROR_STOP on
\pset pager off

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
         EXISTS (SELECT 1 FROM crons c WHERE c.command ILIKE '%' || m.mv_relname || '%') AS has_cron,
         EXTRACT(EPOCH FROM (now() - m.last_touch))/3600 AS hours_since
    FROM mvs m
)
SELECT mv_name,
       ROUND(hours_since::numeric, 1) AS hours_since_refresh,
       has_cron,
       CASE WHEN NOT has_cron THEN 'NO_CRON'
            WHEN hours_since > 24 THEN 'STALE_GT_24H'
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
       SELECT 1 FROM cron.job j WHERE j.command ILIKE '%' || c.relname || '%'
     );
  IF v_bad > 0 THEN
    RAISE WARNING '⚠ % MV(s) sem cron REFRESH correspondente', v_bad;
  ELSE
    RAISE NOTICE '✔ Todas MVs com cron REFRESH mapeado';
  END IF;
END
$BODY$;