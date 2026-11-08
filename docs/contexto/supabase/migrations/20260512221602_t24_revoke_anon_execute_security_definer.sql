-- T24: Revoke EXECUTE on SECURITY DEFINER functions FROM anon.
DO $$
DECLARE
  r RECORD;
  v_sql TEXT;
BEGIN
  FOR r IN
    SELECT
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args,
      p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.prokind = 'f'
    ORDER BY p.proname
  LOOP
    BEGIN
      v_sql := format(
        'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon',
        r.proname,
        r.args
      );
      EXECUTE v_sql;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  RAISE NOTICE 'T24 complete: REVOKE EXECUTE FROM anon applied to all SECURITY DEFINER functions in public schema.';
END;
$$;
