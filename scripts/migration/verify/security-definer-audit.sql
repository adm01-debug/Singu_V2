-- security-definer-audit.sql — Falha se funcao SECURITY DEFINER nao tiver search_path fixo.
-- Vetor classico de privilege escalation via search_path hijack.
\set ON_ERROR_STOP on
\pset pager off

WITH bad AS (
  SELECT n.nspname || '.' || p.proname AS func,
         pg_get_function_identity_arguments(p.oid) AS args,
         p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.prosecdef = true
     AND (p.proconfig IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM unnest(p.proconfig) c
             WHERE c ILIKE 'search_path=%'
          ))
)
SELECT * FROM bad;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prosecdef = true
     AND (p.proconfig IS NULL
          OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c ILIKE 'search_path=%'));
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'SECURITY DEFINER SEM search_path: % funcao(oes) vulneravel(is)', v_bad;
  END IF;
  RAISE NOTICE 'OK Todas SECURITY DEFINER com search_path fixo';
END
$BODY$;