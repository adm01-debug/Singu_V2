-- Fix A: Revoke redistribute_admin_portfolio from authenticated
DO $$
BEGIN
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.redistribute_admin_portfolio(uuid, uuid[], integer) FROM authenticated;
  EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'revoke skip: %', SQLERRM; END;
  BEGIN
    GRANT EXECUTE ON FUNCTION public.redistribute_admin_portfolio(uuid, uuid[], integer) TO service_role;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END;
$$;

-- Fix B: Set search_path='public' on non-extension business logic functions
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef = false
      AND NOT EXISTS (SELECT 1 FROM pg_options_to_table(p.proconfig) WHERE option_name = 'search_path')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid WHERE d.objid = p.oid AND d.deptype = 'e')
    ORDER BY p.proname
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''public''', r.proname, r.args);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'skip % (%): %', r.proname, r.args, SQLERRM; END;
  END LOOP;
END;
$$;
