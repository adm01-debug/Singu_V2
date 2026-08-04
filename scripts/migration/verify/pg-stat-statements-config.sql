-- pg-stat-statements-config.sql — Valida captura completa de queries.
\set ON_ERROR_STOP on
\pset pager off

SELECT name, setting, source FROM pg_settings
 WHERE name IN ('pg_stat_statements.track','pg_stat_statements.track_utility',
                'pg_stat_statements.max','shared_preload_libraries')
 ORDER BY name;

DO $BODY$
DECLARE v_track text; v_util text; v_ext int;
BEGIN
  SELECT COUNT(*) INTO v_ext FROM pg_extension WHERE extname = 'pg_stat_statements';
  IF v_ext = 0 THEN
    RAISE EXCEPTION 'pg_stat_statements NAO instalado';
  END IF;
  SELECT setting INTO v_track FROM pg_settings WHERE name = 'pg_stat_statements.track';
  SELECT setting INTO v_util  FROM pg_settings WHERE name = 'pg_stat_statements.track_utility';
  IF v_track <> 'all' THEN
    RAISE WARNING 'track=% (recomendado: all)', v_track;
  END IF;
  IF v_util = 'off' THEN
    RAISE WARNING 'track_utility=off perde DDL';
  END IF;
  RAISE NOTICE 'OK config track=% utility=%', v_track, v_util;
END
$BODY$;