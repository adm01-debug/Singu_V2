-- pg-stat-statements-config.sql — Valida captura completa de queries.
-- Classe   : GUARD WARN (a extensao e o proprio objeto da checagem)
-- Limiar   : falha se pg_stat_statements nao esta instalado ou nao esta carregado
--            (shared_preload_libraries); RAISE WARNING se track <> all ou track_utility=off.
-- Variaveis: nenhuma
-- Saida    : 0 = ok (com ou sem WARNING); 3 = extensao ausente/nao carregada (RAISE EXCEPTION).
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
  -- Os GUCs pg_stat_statements.* so existem quando a biblioteca foi carregada.
  v_track := current_setting('pg_stat_statements.track', true);
  v_util  := current_setting('pg_stat_statements.track_utility', true);
  IF v_track IS NULL THEN
    RAISE EXCEPTION 'pg_stat_statements instalado mas NAO carregado (shared_preload_libraries)';
  END IF;
  IF v_track <> 'all' THEN
    RAISE WARNING 'track=% (recomendado: all)', v_track;
  END IF;
  IF v_util = 'off' THEN
    RAISE WARNING 'track_utility=off perde DDL';
  END IF;
  RAISE NOTICE 'OK config track=% utility=%', v_track, v_util;
END
$BODY$;
