-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260410163504
-- nome:   harden_functions_search_path_all

DO $$
DECLARE
  f record;
  cnt int := 0;
  err int := 0;
BEGIN
  FOR f IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.prokind='f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.proconfig,ARRAY[]::text[])) cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
        f.nspname, f.proname, f.args
      );
      cnt := cnt + 1;
    EXCEPTION WHEN OTHERS THEN
      err := err + 1;
      RAISE NOTICE 'Falhou %.%(%): %', f.nspname, f.proname, f.args, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'OK: %, falhas: %', cnt, err;
END $$;
