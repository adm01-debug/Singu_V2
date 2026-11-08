-- Migration: fix_secdef_impersonation_guard_all (Wave 156)
-- SECURITY FIX: Extends Wave 155's impersonation guard to the remaining
-- SECURITY DEFINER functions in public that accept p_user_id uuid but were
-- not covered by the previous wave (either read-only or lacking
-- DEFAULT auth.uid() in their signature).
--
-- Categories fixed:
--   A. Read-only functions with DEFAULT auth.uid()  (e.g. get_favorites,
--      count_notifications_unread, get_user_dashboard_config) — any
--      authenticated user could call these with a victim UUID and read
--      another salesperson's full CRM dashboard / notifications / reports.
--
--   B. DML + read functions WITHOUT DEFAULT auth.uid() that are
--      user-callable (e.g. create_calendar_event, set_sales_goal,
--      mark_all_notifications_read, complete_task_batch) — callers must
--      supply p_user_id explicitly; a malicious user supplies the victim's
--      UUID instead of their own.
--
-- Guard semantics (unchanged from Wave 155):
--   • NULL p_user_id is NOT impersonation — some backends pass NULL to mean
--     "no user context"; the guard lets these through.
--   • auth.uid() IS NULL (service_role / cron / edge function) → trusted.
--   • auth.uid() != p_user_id AND both non-NULL → EXCEPTION.
--
-- assert_self_user_id() is updated to add the NULL p_user_id clause.
-- singu_* are excluded (already fixed in Wave 154 via direct auth.uid() use).

-- ── 1. Update helper to handle NULL p_user_id correctly ──────────────────────
CREATE OR REPLACE FUNCTION public.assert_self_user_id(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Three pass-through cases:
  --   auth.uid() IS NULL  → service_role / cron caller, trusted
  --   p_user_id IS NULL   → no specific user claim, not impersonation
  --   p_user_id = auth.uid() → caller operating on their own data
  IF auth.uid() IS NOT NULL
     AND p_user_id IS NOT NULL
     AND p_user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Unauthorized: cannot perform operations on behalf of another user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_self_user_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_self_user_id(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.assert_self_user_id(uuid) TO authenticated, service_role;

-- ── 2. Patch all remaining qualifying functions ───────────────────────────────
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_self_user_id(p_user_id);';
  patched       int  := 0;
  skipped       int  := 0;
BEGIN
  FOR r IN
    SELECT
      p.oid,
      p.proname,
      pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      -- Has scalar p_user_id param (not array p_user_ids)
      AND pg_get_function_arguments(p.oid)  LIKE '%p_user_id %'
      AND pg_get_function_arguments(p.oid) NOT LIKE '%p_user_ids%'
      -- Not already guarded
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
      -- Exclude singu_* — already enforce auth.uid() directly (Wave 154)
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := r.def;

    -- Fix pg_temp → pg_catalog while here (defence-in-depth)
    fn_def := replace(
      fn_def,
      'SET search_path TO ''public'', ''pg_temp''',
      'SET search_path TO ''public'', ''pg_catalog'''
    );

    -- Locate first standalone \nBEGIN\n — the outer function body's BEGIN
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 156] No standalone BEGIN found in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    -- Splice: …BEGIN + guard + \n[original first stmt]
    -- nl_begin layout (1-indexed in fn_def):
    --   nl_begin_pos+0 = '\n'  before BEGIN
    --   nl_begin_pos+1 = 'B'
    --   nl_begin_pos+5 = 'N'
    --   nl_begin_pos+6 = '\n'  after BEGIN
    new_def :=
        substring(fn_def FROM 1 FOR nl_begin_pos + 5)   -- …BEGIN
      || guard_call                                       -- \n  PERFORM…;
      || substring(fn_def FROM nl_begin_pos + 6);        -- \n  [original first stmt]

    IF new_def NOT LIKE '%assert_self_user_id%' THEN
      RAISE WARNING '[Wave 156] Guard not found after insertion in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE new_def;
      patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 156] EXECUTE failed for %: %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE '[Wave 156] assert_self_user_id guard injected into % functions; % skipped',
               patched, skipped;
END;
$$;
