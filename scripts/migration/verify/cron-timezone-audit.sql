-- cron-timezone-audit.sql — Sinaliza cron.job sem timezone explícito ou não-UTC.
-- pg_cron interpreta schedule no TZ da sessão; sem prefixo CRON_TZ= ou DB em UTC,
-- jobs disparam em horários errados após restore em outro TZ.
\set ON_ERROR_STOP on
\pset pager off

SELECT current_setting('TimeZone') AS db_timezone;

SELECT jobid, jobname, schedule, database,
       CASE
         WHEN schedule ILIKE 'CRON_TZ=UTC%' THEN 'OK_UTC'
         WHEN schedule ILIKE 'CRON_TZ=%'    THEN 'OK_OTHER_TZ'
         WHEN current_setting('TimeZone') = 'UTC' THEN 'IMPLICIT_UTC'
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
     AND current_setting('TimeZone') <> 'UTC';
  IF v_bad > 0 THEN
    RAISE WARNING '⚠ % cron job(s) com TZ ambíguo', v_bad;
  ELSE
    RAISE NOTICE '✔ Cron jobs com TZ consistente';
  END IF;
END
$BODY$;