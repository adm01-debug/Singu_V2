-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721195305
-- nome:   revoke_public_execute_secdef_public_schema

DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proacl IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM aclexplode(p.proacl) ace
        WHERE ace.grantee = 0
          AND ace.privilege_type = 'EXECUTE'
      )
    ORDER BY p.proname
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC',
        f.func_name, f.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not revoke PUBLIC execute on public.%(%): %',
        f.func_name, f.args, SQLERRM;
    END;
  END LOOP;
END $$;
