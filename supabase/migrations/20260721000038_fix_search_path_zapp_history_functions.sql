-- Migration: fix_search_path_zapp_history_functions (Wave 124)
-- Pins search_path on all zapp_history schema functions that lack it.
-- Prevents search_path hijacking: a function with mutable search_path can be
-- exploited if a malicious object is injected into a schema that appears earlier
-- in the search_path during function execution.
-- All 50 affected functions are non-SECURITY DEFINER triggers/utilities;
-- pinning to 'zapp_history, pg_catalog' is correct and safe.

DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'zapp_history'
      AND p.prokind = 'f'
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
        )
      )
    ORDER BY p.proname
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION zapp_history.%I(%s) SET search_path = ''zapp_history'', pg_catalog',
        f.proname,
        f.args
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not alter function zapp_history.%(%): %',
          f.proname, f.args, SQLERRM;
    END;
  END LOOP;
END $$;
