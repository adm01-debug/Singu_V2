-- Migration: fix_secdef_impersonation_guard (Wave 155)
-- SECURITY FIX: 28+ SECURITY DEFINER functions in the public schema accept
-- p_user_id uuid DEFAULT auth.uid() and use that value to scope data
-- reads/writes.  SECURITY DEFINER bypasses RLS, so the p_user_id WHERE
-- clause is the ONLY access control boundary.
--
-- Exploit: authenticated user Alice calls
--   SELECT create_task('title', now(), null, null, null, null, null, null,
--                      bob_uuid)
-- and a task owned by Bob is created. Similarly for get_*, toggle_favorite,
-- mark_notification_read, save_user_dashboard_config, etc.
--
-- Fix strategy:
--   1. Create public.assert_self_user_id(uuid) — raises if the caller
--      (auth.uid()) is not the supplied user_id.  Service-role callers
--      (auth.uid() IS NULL) are exempt, preserving cron/edge-function flows.
--   2. Programmatically patch every qualifying function by injecting a call
--      to assert_self_user_id() immediately after the outer BEGIN.
--
-- Qualification filter:
--   - plpgsql + SECURITY DEFINER in public schema
--   - Signature contains DEFAULT auth.uid() (user-callable function)
--   - Body contains INSERT, UPDATE, DELETE, or EXECUTE (mutating)
--   - Not already patched
--
-- Also fixes pg_temp in search_path → pg_catalog for all patched functions
-- (pg_temp in SECURITY DEFINER enables temp-table shadowing attacks).

-- ── 1. Helper function ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_self_user_id(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Service-role callers have auth.uid() = NULL; they are trusted.
  -- Authenticated users MUST only operate on their own user_id.
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot perform operations on behalf of another user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_self_user_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_self_user_id(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.assert_self_user_id(uuid) TO authenticated, service_role;

-- ── 2. Programmatic patch ─────────────────────────────────────────────────────
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
      -- user-callable: has DEFAULT auth.uid() in at least one parameter
      AND pg_get_function_arguments(p.oid) LIKE '%DEFAULT auth.uid()%'
      -- mutating: body performs DML or dynamic SQL
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y|\yEXECUTE\y')
      -- idempotency: skip already-patched functions
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
    ORDER BY p.proname
  LOOP
    fn_def := r.def;

    -- Fix pg_temp → pg_catalog (separate defence-in-depth win, free here)
    fn_def := replace(
      fn_def,
      'SET search_path TO ''public'', ''pg_temp''',
      'SET search_path TO ''public'', ''pg_catalog'''
    );

    -- Locate first standalone \nBEGIN\n — the outer function body's BEGIN
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 155] No standalone BEGIN found in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    -- Build patched definition:
    --   everything up to and including the 'N' of BEGIN   (positions 1 … nl_begin_pos+5)
    --   guard call ('\n  PERFORM assert_self_user_id(p_user_id);')
    --   remainder starting at '\n' after BEGIN             (position nl_begin_pos+6 …)
    --
    -- nl_begin layout in fn_def (1-indexed):
    --   nl_begin_pos+0 = '\n'  (newline before BEGIN)
    --   nl_begin_pos+1 = 'B'
    --   nl_begin_pos+2 = 'E'
    --   nl_begin_pos+3 = 'G'
    --   nl_begin_pos+4 = 'I'
    --   nl_begin_pos+5 = 'N'
    --   nl_begin_pos+6 = '\n'  (newline after BEGIN)
    new_def :=
        substring(fn_def FROM 1 FOR nl_begin_pos + 5)   -- …BEGIN
      || guard_call                                       -- \n  PERFORM…;
      || substring(fn_def FROM nl_begin_pos + 6);        -- \n  [original first stmt]

    -- Sanity check before executing
    IF new_def NOT LIKE '%assert_self_user_id%' THEN
      RAISE WARNING '[Wave 155] Guard not inserted in %; skipped', r.proname;
      skipped := skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE new_def;
      patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 155] EXECUTE failed for %: %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;

  RAISE NOTICE '[Wave 155] assert_self_user_id guard injected into % functions; % skipped',
               patched, skipped;
END;
$$;
