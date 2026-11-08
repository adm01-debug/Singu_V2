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
        'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC',
        f.schema_name, f.func_name, f.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not revoke public execute on %.%(%): %',
        f.schema_name, f.func_name, f.args, SQLERRM;
    END;
  END LOOP;
END $$;
