-- log-retention-audit.sql — Valida politica de retencao de logs (LGPD).
\set ON_ERROR_STOP on
\pset pager off

SELECT name, setting FROM pg_settings
 WHERE name IN ('log_statement','log_min_duration_statement',
                'log_rotation_age','log_rotation_size','log_truncate_on_rotation')
 ORDER BY name;

DO $BODY$
DECLARE v_stmt text;
BEGIN
  SELECT setting INTO v_stmt FROM pg_settings WHERE name = 'log_statement';
  IF v_stmt = 'all' THEN
    RAISE WARNING 'log_statement=all captura PII - verificar retencao <=30d';
  END IF;
  RAISE NOTICE 'OK log_statement=%', v_stmt;
END
$BODY$;