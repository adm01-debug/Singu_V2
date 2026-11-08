-- Migration: fix_secdef_pg_temp_remaining (Wave 158)
-- SECURITY FIX: 29 SECURITY DEFINER functions in public still have
--   SET search_path TO 'public', 'pg_temp'
-- pg_temp in a SECURITY DEFINER search_path allows any session to pre-create
-- temp objects that shadow built-in functions/operators used by the function
-- body, enabling type-confusion attacks (temp table shadowing).
--
-- These functions were missed by Waves 155-157 because they either lack a
-- p_user_id parameter or were not subject to the impersonation guard patches.
--
-- Fix: programmatic string-replace 'pg_temp' → 'pg_catalog' in each
-- function's SET search_path clause, then re-execute the definition.
-- Functions already using pg_catalog are excluded by the filter.

DO $$
DECLARE
  r        record;
  fn_def   text;
  new_def  text;
  patched  int := 0;
  skipped  int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname  = 'public'
      AND p.prosecdef = true
      AND pg_get_functiondef(p.oid) LIKE '%pg_temp%'
    ORDER BY p.proname
  LOOP
    fn_def := r.def;

    -- Replace the unsafe search_path directive
    new_def := replace(
      fn_def,
      'SET search_path TO ''public'', ''pg_temp''',
      'SET search_path TO ''public'', ''pg_catalog'''
    );

    -- Skip if nothing changed (pg_temp appeared elsewhere but not in SET clause)
    IF new_def = fn_def THEN
      RAISE WARNING '[Wave 158] pg_temp not in SET search_path for %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    -- Sanity: confirm pg_temp is gone and pg_catalog is present
    IF new_def LIKE '%pg_temp%' THEN
      RAISE WARNING '[Wave 158] pg_temp still present after replace in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE new_def;
      patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 158] EXECUTE failed for %: %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE '[Wave 158] pg_temp → pg_catalog patched in % functions; % skipped',
               patched, skipped;
END;
$$;

-- Verify: no SECURITY DEFINER function should still reference pg_temp
DO $$
DECLARE
  remaining int;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND pg_get_functiondef(p.oid) LIKE '%pg_temp%';

  IF remaining > 0 THEN
    RAISE WARNING '[Wave 158] % SECURITY DEFINER functions still reference pg_temp', remaining;
  ELSE
    RAISE NOTICE '[Wave 158] All SECURITY DEFINER functions now use pg_catalog. Clean.';
  END IF;
END;
$$;
