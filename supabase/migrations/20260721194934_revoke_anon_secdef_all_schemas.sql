-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194934
-- nome:   revoke_anon_secdef_all_schemas

DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'zapp_history')
      AND p.prosecdef = true
      AND has_function_privilege('anon', p.oid, 'execute')
    ORDER BY n.nspname, p.proname
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM anon',
        f.schema_name, f.func_name, f.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not revoke anon execute on %.%(%): %',
        f.schema_name, f.func_name, f.args, SQLERRM;
    END;
  END LOOP;
END $$;
