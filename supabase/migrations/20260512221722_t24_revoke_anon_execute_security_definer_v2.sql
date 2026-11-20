-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260512221722
-- nome:   t24_revoke_anon_execute_security_definer_v2

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.prokind = 'f'
    ORDER BY p.proname
  LOOP
    -- Remove the PUBLIC grant (this is what gives anon access via inheritance)
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC',
        r.proname, r.args
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Re-grant explicitly to authenticated
    BEGIN
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',
        r.proname, r.args
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Re-grant explicitly to service_role
    BEGIN
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',
        r.proname, r.args
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;

  RAISE NOTICE 'T24 complete: REVOKE EXECUTE FROM PUBLIC applied to all SECURITY DEFINER functions. authenticated and service_role grants preserved.';
END;
$$;
