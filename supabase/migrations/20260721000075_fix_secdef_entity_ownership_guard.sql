-- Migration: fix_secdef_entity_ownership_guard (Wave 161)
-- SECURITY FIX: 13 additional SECURITY DEFINER functions accept entity-specific
-- id parameters (p_deal_id, p_event_id, p_interaction_id, p_note_id,
-- p_reminder_id, p_task_id) but perform DML with NO ownership check.
--
-- Attack surface: any authenticated user can call e.g.
--   SELECT complete_task(victim_task_uuid)
-- and mark another user's task as complete, or
--   SELECT archive_note(victim_note_uuid)
-- and archive someone else's notes.
--
-- Fix strategy:
--   1. Create assert_*_access(uuid) helpers for each entity type.
--   2. CRLF-aware DO blocks inject the guards into every qualifying function.
--   3. log_automation_execution is locked to service_role (auth.uid() IS NULL).
--   4. Products functions (fn_apply_auto_tag_rules, update_product_stock) are
--      skipped — products is a shared catalog with no per-user ownership
--      (RLS policy products_all: any authenticated user, no user_id column).
--
-- Pass-through: same triple-case as all prior guards:
--   • auth.uid() IS NULL → service_role / cron / automation, trusted
--   • p_*_id IS NULL    → no specific object, not a targeted attack
--   • row.user_id = auth.uid() → caller owns the record

-- ── 1. Helper: assert_deal_access ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_deal_access(p_deal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_deal_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM deals WHERE id = p_deal_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: deal % does not belong to the current user', p_deal_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_deal_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_deal_access(uuid) TO authenticated, service_role;

-- ── 2. Helper: assert_event_access ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_event_access(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_event_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM calendar_events WHERE id = p_event_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: event % does not belong to the current user', p_event_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_event_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_event_access(uuid) TO authenticated, service_role;

-- ── 3. Helper: assert_interaction_access ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_interaction_access(p_interaction_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_interaction_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM interactions WHERE id = p_interaction_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: interaction % does not belong to the current user', p_interaction_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_interaction_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_interaction_access(uuid) TO authenticated, service_role;

-- ── 4. Helper: assert_note_access ────────────────────────────────────────────
-- Note: archive_note/toggle_note_pin operate on quick_notes (not a 'notes' table)
CREATE OR REPLACE FUNCTION public.assert_note_access(p_note_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_note_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM quick_notes WHERE id = p_note_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: note % does not belong to the current user', p_note_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_note_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_note_access(uuid) TO authenticated, service_role;

-- ── 5. Helper: assert_reminder_access ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_reminder_access(p_reminder_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_reminder_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM reminders WHERE id = p_reminder_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: reminder % does not belong to the current user', p_reminder_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_reminder_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_reminder_access(uuid) TO authenticated, service_role;

-- ── 6. Helper: assert_task_access ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assert_task_access(p_task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_task_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM tasks WHERE id = p_task_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: task % does not belong to the current user', p_task_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_task_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_task_access(uuid) TO authenticated, service_role;

-- ── 7. Inject guards via CRLF-aware DO blocks ────────────────────────────────

-- Helper macro: inject guard into all matching SECURITY DEFINER functions
-- for a given parameter name and guard call text.

-- 7a. Deal guard (p_deal_id)
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_deal_access(p_deal_id);';
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
      AND pg_get_function_arguments(p.oid) LIKE '%p_deal_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_deal_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13) || chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 161] No BEGIN in % (deal); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos + 5) || guard_call || substring(fn_def FROM nl_begin_pos + 6);
    IF new_def NOT LIKE '%assert_deal_access%' THEN
      RAISE WARNING '[Wave 161] Guard missing after insert in % (deal); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 161] EXECUTE failed for % (deal): %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 161] assert_deal_access injected into % functions; % skipped', patched, skipped;
END;
$$;

-- 7b. Event guard (p_event_id)
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_event_access(p_event_id);';
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
      AND pg_get_function_arguments(p.oid) LIKE '%p_event_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_event_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13) || chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 161] No BEGIN in % (event); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos + 5) || guard_call || substring(fn_def FROM nl_begin_pos + 6);
    IF new_def NOT LIKE '%assert_event_access%' THEN
      RAISE WARNING '[Wave 161] Guard missing after insert in % (event); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 161] EXECUTE failed for % (event): %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 161] assert_event_access injected into % functions; % skipped', patched, skipped;
END;
$$;

-- 7c. Interaction guard (p_interaction_id)
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_interaction_access(p_interaction_id);';
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
      AND pg_get_function_arguments(p.oid) LIKE '%p_interaction_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_interaction_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13) || chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 161] No BEGIN in % (interaction); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos + 5) || guard_call || substring(fn_def FROM nl_begin_pos + 6);
    IF new_def NOT LIKE '%assert_interaction_access%' THEN
      RAISE WARNING '[Wave 161] Guard missing after insert in % (interaction); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 161] EXECUTE failed for % (interaction): %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 161] assert_interaction_access injected into % functions; % skipped', patched, skipped;
END;
$$;

-- 7d. Note guard (p_note_id → quick_notes.user_id)
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_note_access(p_note_id);';
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
      AND pg_get_function_arguments(p.oid) LIKE '%p_note_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_note_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13) || chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 161] No BEGIN in % (note); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos + 5) || guard_call || substring(fn_def FROM nl_begin_pos + 6);
    IF new_def NOT LIKE '%assert_note_access%' THEN
      RAISE WARNING '[Wave 161] Guard missing after insert in % (note); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 161] EXECUTE failed for % (note): %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 161] assert_note_access injected into % functions; % skipped', patched, skipped;
END;
$$;

-- 7e. Reminder guard (p_reminder_id)
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_reminder_access(p_reminder_id);';
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
      AND pg_get_function_arguments(p.oid) LIKE '%p_reminder_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_reminder_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13) || chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 161] No BEGIN in % (reminder); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos + 5) || guard_call || substring(fn_def FROM nl_begin_pos + 6);
    IF new_def NOT LIKE '%assert_reminder_access%' THEN
      RAISE WARNING '[Wave 161] Guard missing after insert in % (reminder); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 161] EXECUTE failed for % (reminder): %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 161] assert_reminder_access injected into % functions; % skipped', patched, skipped;
END;
$$;

-- 7f. Task guard (p_task_id)
DO $$
DECLARE
  r             record;
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text := chr(10) || '  PERFORM public.assert_task_access(p_task_id);';
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
      AND pg_get_function_arguments(p.oid) LIKE '%p_task_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_task_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
      -- log_automation_execution uses p_task_id but is service-only; handled separately
      AND p.proname != 'log_automation_execution'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13) || chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 161] No BEGIN in % (task); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos + 5) || guard_call || substring(fn_def FROM nl_begin_pos + 6);
    IF new_def NOT LIKE '%assert_task_access%' THEN
      RAISE WARNING '[Wave 161] Guard missing after insert in % (task); skipped', r.proname;
      skipped := skipped + 1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 161] EXECUTE failed for % (task): %', r.proname, SQLERRM;
      skipped := skipped + 1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 161] assert_task_access injected into % functions; % skipped', patched, skipped;
END;
$$;

-- ── 8. Lock log_automation_execution to service_role only ────────────────────
-- This function is called exclusively by the automation engine (service_role).
-- Any authenticated user calling it can corrupt interaction status records.
DO $$
DECLARE
  fn_def        text;
  new_def       text;
  nl_begin      text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos  int;
  guard_call    text :=
    chr(10) || '  IF auth.uid() IS NOT NULL THEN' ||
    chr(10) || '    RAISE EXCEPTION ''log_automation_execution is reserved for the service role''' ||
    chr(10) || '      USING ERRCODE = ''insufficient_privilege'';' ||
    chr(10) || '  END IF;';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO fn_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'log_automation_execution';

  IF fn_def IS NULL THEN
    RAISE NOTICE '[Wave 161] log_automation_execution not found; skip';
    RETURN;
  END IF;

  IF fn_def LIKE '%auth.uid()%' THEN
    RAISE NOTICE '[Wave 161] log_automation_execution already guarded; skip';
    RETURN;
  END IF;

  fn_def := replace(fn_def, chr(13) || chr(10), chr(10));
  fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');

  nl_begin_pos := strpos(fn_def, nl_begin);
  IF nl_begin_pos = 0 THEN
    RAISE WARNING '[Wave 161] log_automation_execution: no BEGIN found; skipped';
    RETURN;
  END IF;

  new_def :=
      substring(fn_def FROM 1 FOR nl_begin_pos + 5)
    || guard_call
    || substring(fn_def FROM nl_begin_pos + 6);

  EXECUTE new_def;
  RAISE NOTICE '[Wave 161] log_automation_execution locked to service_role';
END;
$$;

-- ── 9. Revoke direct execute from authenticated on new guard helpers ──────────
-- (already done per helper above; this block ensures clean state)
REVOKE ALL ON FUNCTION public.assert_deal_access(uuid)        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_event_access(uuid)       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_interaction_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_note_access(uuid)        FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_reminder_access(uuid)    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assert_task_access(uuid)        FROM PUBLIC;

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
      pg_get_function_arguments(p.oid) LIKE '%p_deal_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_event_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_interaction_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_note_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_reminder_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_task_id %'
    )
    AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_deal_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_event_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_interaction_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_note_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_reminder_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_task_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
    AND p.proname NOT LIKE 'singu_%'
    -- products are shared catalog — excluded by design
    AND p.proname NOT IN ('fn_apply_auto_tag_rules','update_product_stock');

  RAISE NOTICE '[Wave 161] Remaining unguarded entity-DML functions: %', still_unguarded;
END;
$$;
