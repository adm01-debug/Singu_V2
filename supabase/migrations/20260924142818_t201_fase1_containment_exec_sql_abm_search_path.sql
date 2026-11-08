-- Fase 1 (plano banco-único Singu) — contenção de segurança urgente
-- etapas 9,10,11,14,15,16 do plano; 0 chamadas a exec_sql/execute_readonly_query nas últimas 24h (checado via query_logs antes de revogar)
-- Aplicada em produção via MCP em 2026-09-24. Este arquivo é o registro versionado (etapa 26).

DO $migration$
DECLARE
  function_definition record;
  function_signature text;
BEGIN
  FOR function_definition IN
    SELECT *
    FROM (VALUES
      ('public.exec_sql(text)', 'anon, authenticated, public'),
      ('public.execute_readonly_query(text)', 'authenticated, public'),
      ('public.decrypt_connection_config(bytea)', 'anon, public'),
      ('public.encrypt_connection_config(jsonb)', 'anon, public')
    ) AS functions(function_signature, revoked_roles)
  LOOP
    IF to_regprocedure(function_definition.function_signature) IS NOT NULL THEN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %s FROM %s',
        function_definition.function_signature,
        function_definition.revoked_roles
      );
    END IF;
  END LOOP;

  IF to_regclass('public.abm_account_plans') IS NOT NULL THEN
    ALTER TABLE public.abm_account_plans ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class
    WHERE oid = to_regclass('public.vw_singu_data_health')
      AND relkind = 'v'
  ) THEN
    ALTER VIEW public.vw_singu_data_health SET (security_invoker = on);
  END IF;

  FOREACH function_signature IN ARRAY ARRAY[
    'public.normalizar_cnpj(text)',
    'public.title_case_pt(text)',
    'public.title_case_pt_aux(text)'
  ]
  LOOP
    IF to_regprocedure(function_signature) IS NOT NULL THEN
      EXECUTE format(
        'ALTER FUNCTION %s SET search_path = public, pg_temp',
        function_signature
      );
    END IF;
  END LOOP;
END;
$migration$;
