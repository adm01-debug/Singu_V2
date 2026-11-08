-- Migration: fix_secdef_object_ownership_guard (Wave 160)
-- SECURITY FIX: 46 SECURITY DEFINER functions accept p_company_id or
-- p_contact_id but have NO ownership check.  Because SECURITY DEFINER
-- bypasses RLS, any authenticated user can call e.g.:
--   SELECT assign_salesperson(bob_company_uuid, alice_vendor_id)
-- and reassign ownership of Bob's company to Alice.
--
-- Root cause: RLS policy singu_companies_select enforces auth.uid()=user_id
-- for direct table access but SECURITY DEFINER functions run as postgres.
--
-- Fix strategy:
--   1. Create assert_company_access(uuid) — raises if auth.uid() is non-NULL
--      and the caller does not own the target company.
--   2. Create assert_contact_access(uuid) — same for contacts.
--   3. Programmatic DO block injects assert_company_access / assert_contact_access
--      immediately after BEGIN in every qualifying function.
--      CRLF normalisation (cr+lf → lf) is applied before the strpos search
--      to handle the same CRLF blind-spot that caused 7 functions to be
--      missed in Wave 156.
--
-- Pass-through cases (same pattern as assert_self_user_id):
--   • auth.uid() IS NULL   → service_role / cron caller, trusted
--   • p_*_id IS NULL       → no specific object, not an ownership claim
--   • company/contact.user_id = auth.uid() → caller owns the object

-- ── 1. Helper: assert_company_access ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_company_access(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_company_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM companies WHERE id = p_company_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: company % does not belong to the current user', p_company_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_company_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_company_access(uuid) TO authenticated, service_role;

-- ── 2. Helper: assert_contact_access ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_contact_access(p_contact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_contact_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM contacts WHERE id = p_contact_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: contact % does not belong to the current user', p_contact_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_contact_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_contact_access(uuid) TO authenticated, service_role;

-- ── 3. Inject company ownership guard ────────────────────────────────────────
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_company_access(p_company_id);';
  patched       int  := 0;
  skipped       int  := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      -- scalar p_company_id (not array p_company_ids)
      AND pg_get_function_arguments(p.oid)  LIKE '%p_company_id %'
      AND pg_get_function_arguments(p.oid) NOT LIKE '%p_company_ids%'
      -- does DML
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      -- not already guarded
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := r.def;

    -- Normalise CRLF → LF (Wave 156 missed 7 functions due to this)
    fn_def := replace(fn_def, chr(13) || chr(10), chr(10));

    -- Fix pg_temp → pg_catalog while here
    fn_def := replace(
      fn_def,
      'SET search_path TO ''public'', ''pg_temp''',
      'SET search_path TO ''public'', ''pg_catalog'''
    );

    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 160] No standalone BEGIN found in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    new_def :=
        substring(fn_def FROM 1 FOR nl_begin_pos + 5)
      || guard_call
      || substring(fn_def FROM nl_begin_pos + 6);

    IF new_def NOT LIKE '%assert_company_access%' THEN
      RAISE WARNING '[Wave 160] Guard not found after insertion in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE new_def;
      patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 160] EXECUTE failed for %: %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE '[Wave 160] assert_company_access injected into % functions; % skipped',
               patched, skipped;
END;
$$;

-- ── 4. Inject contact ownership guard ────────────────────────────────────────
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_contact_access(p_contact_id);';
  patched       int  := 0;
  skipped       int  := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      -- scalar p_contact_id (not array)
      AND pg_get_function_arguments(p.oid)  LIKE '%p_contact_id %'
      AND pg_get_function_arguments(p.oid) NOT LIKE '%p_contact_ids%'
      -- does DML
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      -- not already guarded (either type)
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_contact_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := r.def;

    -- Normalise CRLF → LF
    fn_def := replace(fn_def, chr(13) || chr(10), chr(10));

    fn_def := replace(
      fn_def,
      'SET search_path TO ''public'', ''pg_temp''',
      'SET search_path TO ''public'', ''pg_catalog'''
    );

    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 160] No standalone BEGIN found in % (contact guard); skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    new_def :=
        substring(fn_def FROM 1 FOR nl_begin_pos + 5)
      || guard_call
      || substring(fn_def FROM nl_begin_pos + 6);

    IF new_def NOT LIKE '%assert_contact_access%' THEN
      RAISE WARNING '[Wave 160] Contact guard not found after insertion in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE new_def;
      patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 160] EXECUTE failed for % (contact guard): %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE '[Wave 160] assert_contact_access injected into % functions; % skipped',
               patched, skipped;
END;
$$;

-- ── 5. Patch bulk_assign_salesperson separately (array p_company_ids) ────────
-- This function takes p_company_ids uuid[] — not caught by the scalar filter
-- above. Add an explicit ownership batch-check at the top.
DO $$
DECLARE
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text :=
    chr(10) || '  -- Ownership check: caller must own every company in the batch' ||
    chr(10) || '  IF auth.uid() IS NOT NULL AND EXISTS (' ||
    chr(10) || '    SELECT 1 FROM companies WHERE id = ANY(p_company_ids)' ||
    chr(10) || '      AND user_id IS DISTINCT FROM auth.uid()' ||
    chr(10) || '  ) THEN' ||
    chr(10) || '    RAISE EXCEPTION ''Unauthorized: one or more companies do not belong to you''' ||
    chr(10) || '      USING ERRCODE = ''insufficient_privilege'';' ||
    chr(10) || '  END IF;';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO fn_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'bulk_assign_salesperson';

  IF fn_def IS NULL THEN
    RAISE NOTICE '[Wave 160] bulk_assign_salesperson not found; skip';
    RETURN;
  END IF;

  IF fn_def LIKE '%auth.uid()%' THEN
    RAISE NOTICE '[Wave 160] bulk_assign_salesperson already guarded; skip';
    RETURN;
  END IF;

  fn_def := replace(fn_def, chr(13) || chr(10), chr(10));
  fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');

  nl_begin_pos := strpos(fn_def, nl_begin);
  IF nl_begin_pos = 0 THEN
    RAISE WARNING '[Wave 160] bulk_assign_salesperson: no BEGIN found; skipped';
    RETURN;
  END IF;

  new_def :=
      substring(fn_def FROM 1 FOR nl_begin_pos + 5)
    || guard_call
    || substring(fn_def FROM nl_begin_pos + 6);

  EXECUTE new_def;
  RAISE NOTICE '[Wave 160] bulk_assign_salesperson patched';
END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  still_unguarded int;
BEGIN
  SELECT COUNT(*) INTO still_unguarded
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
    AND (
      pg_get_function_arguments(p.oid) LIKE '%p_company_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_contact_id %'
    )
    AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_contact_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
    AND p.proname NOT LIKE 'singu_%';

  RAISE NOTICE '[Wave 160] Remaining unguarded company/contact DML functions: %',
               still_unguarded;
END;
$$;
