-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194717
-- nome:   fix_search_path_zapp_history_functions

DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'zapp_history'
      AND p.prokind = 'f'
      AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
      ))
    ORDER BY p.proname
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION zapp_history.%I(%s) SET search_path = ''zapp_history'', pg_catalog',
        f.proname, f.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not alter function zapp_history.%(%): %', f.proname, f.args, SQLERRM;
    END;
  END LOOP;
END $$;
