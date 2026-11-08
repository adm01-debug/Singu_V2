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
