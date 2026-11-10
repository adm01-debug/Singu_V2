-- cron-timezone-audit.sql — Sinaliza cron.job sem timezone explícito ou não-UTC.
-- pg_cron interpreta o schedule em cron.timezone (default GMT) ou, em builds antigos,
-- no TZ do servidor; sem prefixo CRON_TZ= e fora de UTC, jobs disparam em horários
-- errados após restore em outro TZ.
-- Classe   : AUDIT (RAISE WARNING no achado; nunca falha)
-- Variaveis: nenhuma
-- Saida    : 0 (inclusive SKIP).
-- Requer   : pg_cron (tabela cron.job). Ausente: SKIP com NOTICE.
\set ON_ERROR_STOP on
\pset pager off

SELECT current_setting('TimeZone') AS db_timezone,
       current_setting('cron.timezone', true) AS cron_timezone;
SELECT to_regclass('cron.job') IS NOT NULL AS tem_cron \gset
\if :tem_cron
SELECT jobid, jobname, schedule, database,
       CASE
         WHEN schedule ILIKE 'CRON_TZ=UTC%' THEN 'OK_UTC'
         WHEN schedule ILIKE 'CRON_TZ=%'    THEN 'OK_OTHER_TZ'
         WHEN COALESCE(current_setting('cron.timezone', true), current_setting('TimeZone'))
              IN ('UTC','Etc/UTC','GMT','Etc/GMT') THEN 'IMPLICIT_UTC'
         ELSE 'AMBIGUOUS_TZ'
       END AS tz_status
  FROM cron.job
 ORDER BY tz_status DESC, jobname;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM cron.job
   WHERE schedule NOT ILIKE 'CRON_TZ=%'
     AND COALESCE(current_setting('cron.timezone', true), current_setting('TimeZone'))
         NOT IN ('UTC','Etc/UTC','GMT','Etc/GMT');
  IF v_bad > 0 THEN
    RAISE WARNING '⚠ % cron job(s) com TZ ambíguo', v_bad;
  ELSE
    RAISE NOTICE '✔ Cron jobs com TZ consistente';
  END IF;
END
$BODY$;
\else
\echo 'NOTICE: SKIP pg_cron nao instalado (cron.job ausente).'
\endif
