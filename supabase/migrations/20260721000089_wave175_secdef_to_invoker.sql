-- Migration: wave175_secdef_to_invoker (Wave 175)
-- SECURITY FIX: 982 SECURITY DEFINER functions in public schema were callable
-- by the `authenticated` role via /rest/v1/rpc/<name>. These ran with the
-- privileges of the function owner (postgres/superuser), bypassing RLS on every
-- table they touched — any authenticated user could invoke them and potentially
-- read/write data from all tenants.
--
-- Fix: Convert all non-extension SECURITY DEFINER functions in public schema to
-- SECURITY INVOKER. Functions now run with the calling role's privileges, so
-- RLS properly scopes all table access inside them. This is safe because all
-- tables have ownership-scoped RLS policies (Waves 161-174).
--
-- Note: service_role callers (backend) bypass RLS regardless of SECURITY INVOKER,
-- so administrative/batch functions called from the backend are unaffected.

DO $$
DECLARE
  r RECORD;
  converted_count int := 0;
  skip_count      int := 0;
BEGIN
  FOR r IN
    SELECT
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS func_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = TRUE
      -- Exclude extension-owned functions (pg_net, etc.)
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION public.%I(%s) SECURITY INVOKER',
        r.proname, r.func_args
      );
      converted_count := converted_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped %.(%s): %', r.proname, r.func_args, SQLERRM;
      skip_count := skip_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '[Wave 175] Converted % functions to SECURITY INVOKER (% skipped)', converted_count, skip_count;
END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  remaining int;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef = TRUE
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
    -- Exclude extension functions (they legitimately stay SECURITY DEFINER)
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d
      JOIN pg_extension e ON e.oid = d.refobjid
      WHERE d.objid = p.oid AND d.deptype = 'e'
    );

  IF remaining = 0 THEN
    RAISE NOTICE '[Wave 175] Zero non-extension SECURITY DEFINER functions remain callable by authenticated. Security clean.';
  ELSE
    RAISE WARNING '[Wave 175] % SECURITY DEFINER functions still callable by authenticated', remaining;
  END IF;
END;
$$;
