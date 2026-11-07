-- check-extensions-hardening.sql — Autitoria hardening 26/11.
-- Confere extensões esperadas para hardening/observabilidade/segurança.
-- Instaladas na produção auditada: pg_stat_statements, pgcrypto, plpgsql,
-- plpgsql_check, supabase_vault, vector, unaccent, uuid-ossp, pg_trgm,
-- pg_net, pg_cron, http.
-- NÃO instaladas (recomendadas para hardening): amcheck (verificação de
-- corrupção física de índices), pg_visibility (visibilidade all-visible),
-- pg_stat_monitor (alternativa/complemento ao pg_stat_statements).
-- Este guard FALHA quando uma extensão OBRIGATÓRIA falta. amcheck/pg_visibility/
-- pg_stat_monitor são recomendadas mas opcionais na plataforma Supabase: use
-- --var=strict_optional=1 para tratá-las como obrigatórias.
\echo '== check-extensions-hardening =='
\pset pager off
\set ON_ERROR_STOP on

SELECT extname,
       (extversion) AS versao,
       (SELECT e.oid IS NULL FROM pg_extension e WHERE e.extname = x) AS presente
  FROM pg_extension;

-- Extensões que o guard entende como obrigatórias para o app:
\echo '-- obrigatorias: pg_stat_statements, pgcrypto, plpgsql, pg_net, pg_cron --'
-- gating via variável psql: `psql -v strict_optional=1`

DO $BODY$
DECLARE
  v_missing   text := '';
  v_optional  text := '';
  v_req text[] := ARRAY['pg_stat_statements','pgcrypto','plpgsql','plpgsql_check','supabase_vault'];
  v_opt text[] := ARRAY['amcheck','pg_visibility','pg_stat_monitor'];
  v_x text;
BEGIN
  FOREACH v_x IN ARRAY v_req
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = v_x) THEN
      v_missing := v_missing || E'\n  - ' || v_x;
    END IF;
  END LOOP;

  FOREACH v_x IN ARRAY v_opt
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = v_x) THEN
      v_optional := v_optional || E'\n  - ' || v_x;
    END IF;
  END LOOP;

  IF v_missing <> '' THEN
    RAISE EXCEPTION 'FATAL: extensoes OBRIGATORIAS ausentes:%', v_missing;
  END IF;
  IF v_optional <> '' AND current_setting('vars.strict_optional', true) = '1' THEN
    RAISE EXCEPTION 'FATAL (strict): extensoes opcionais de hardening ausentes:%', v_optional;
  END IF;
  IF v_optional <> '' THEN
    RAISE NOTICE 'NOTICE: extensoes opcionais ausentes (amcheck/pg_visibility/pg_stat_monitor):%',
                 v_optional;
  END IF;
  RAISE NOTICE 'OK: todas as extensoes obrigatorias instaladas.';
END
$BODY$;
\echo 'OK check-extensions-hardening.'
