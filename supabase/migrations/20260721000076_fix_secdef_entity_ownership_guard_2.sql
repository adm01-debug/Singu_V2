-- Migration: fix_secdef_entity_ownership_guard_2 (Wave 162)
-- SECURITY FIX: Second round of entity ownership guards.
--
-- Issues addressed:
--   A. complete_reminder(p_reminder_id uuid) — single-line function body; the
--      Wave 161 DO block's strpos(def, '\nBEGIN\n') returned 0. Explicit patch.
--   B. 7 new assert_*_access helpers for entity types with user_id columns.
--   C. CRLF-aware DO blocks to inject guards into qualifying DML functions.
--   D. redistribute_portfolio / redistribute_portfolio_smart expose a
--      p_from_user_id parameter that bypasses the Wave 156 assert_self_user_id
--      guard (which only matched p_user_id). Fixed here.
--   E. redistribute_admin_portfolio and pure maintenance/automation functions
--      are locked to service_role (auth.uid() IS NULL).

-- ── A. Explicit patch: complete_reminder(p_reminder_id uuid) ─────────────────
-- Original body is a single-line "BEGIN … END;" — no \nBEGIN\n to splice into.
CREATE OR REPLACE FUNCTION public.complete_reminder(p_reminder_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  PERFORM public.assert_reminder_access(p_reminder_id);
  UPDATE reminders SET is_completed = true, completed_at = NOW()
  WHERE id = p_reminder_id;
  RETURN FOUND;
END;
$$;

-- ── B. New guard helpers ──────────────────────────────────────────────────────

-- B1. assert_visit_access — scheduled_visits.user_id
CREATE OR REPLACE FUNCTION public.assert_visit_access(p_visit_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_visit_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM scheduled_visits WHERE id = p_visit_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: visit % does not belong to the current user', p_visit_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_visit_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_visit_access(uuid) TO authenticated, service_role;

-- B2. assert_notification_access — notifications.user_id
CREATE OR REPLACE FUNCTION public.assert_notification_access(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_notification_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM notifications WHERE id = p_notification_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: notification % does not belong to the current user', p_notification_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_notification_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_notification_access(uuid) TO authenticated, service_role;

-- B3. assert_proposal_access — proposals.user_id
CREATE OR REPLACE FUNCTION public.assert_proposal_access(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_proposal_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM proposals WHERE id = p_proposal_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: proposal % does not belong to the current user', p_proposal_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_proposal_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_proposal_access(uuid) TO authenticated, service_role;

-- B4. assert_goal_access — sales_goals.user_id (parameter name: p_goal_id)
CREATE OR REPLACE FUNCTION public.assert_goal_access(p_goal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_goal_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM sales_goals WHERE id = p_goal_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: goal % does not belong to the current user', p_goal_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_goal_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_goal_access(uuid) TO authenticated, service_role;

-- B5. assert_violation_access — sla_violations.user_id
CREATE OR REPLACE FUNCTION public.assert_violation_access(p_violation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_violation_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM sla_violations WHERE id = p_violation_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: SLA violation % does not belong to the current user', p_violation_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_violation_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_violation_access(uuid) TO authenticated, service_role;

-- B6. assert_alert_access — alerts.user_id
CREATE OR REPLACE FUNCTION public.assert_alert_access(p_alert_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_alert_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM alerts WHERE id = p_alert_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: alert % does not belong to the current user', p_alert_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_alert_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_alert_access(uuid) TO authenticated, service_role;

-- B7. assert_customer_access — ownership via customers.company_id → companies.user_id
CREATE OR REPLACE FUNCTION public.assert_customer_access(p_customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND p_customer_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM customers cu
       JOIN companies c ON cu.company_id = c.id
       WHERE cu.id = p_customer_id
         AND c.user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: customer % does not belong to the current user', p_customer_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_customer_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_customer_access(uuid) TO authenticated, service_role;

-- ── C. CRLF-aware DO block injection ─────────────────────────────────────────

-- C1. Visit guard (p_visit_id → scheduled_visits.user_id)
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_visit_access(p_visit_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_visit_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_visit_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (visit); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_visit_access%' THEN RAISE WARNING '[Wave 162] Guard missing in % (visit)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (visit): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_visit_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- C2. Notification guard (p_notification_id)
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_notification_access(p_notification_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_notification_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_notification_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (notification); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_notification_access%' THEN RAISE WARNING '[Wave 162] Guard missing in % (notification)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (notification): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_notification_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- C3. Proposal guard (p_proposal_id)
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_proposal_access(p_proposal_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_proposal_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_proposal_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (proposal); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_proposal_access%' THEN RAISE WARNING '[Wave 162] Guard missing in % (proposal)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (proposal): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_proposal_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- C4. Goal guard (p_goal_id → sales_goals.user_id)
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_goal_access(p_goal_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_goal_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_goal_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (goal); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_goal_access%' THEN RAISE WARNING '[Wave 162] Guard missing in % (goal)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (goal): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_goal_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- C5. SLA violation guard (p_violation_id)
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_violation_access(p_violation_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_violation_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_violation_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (violation); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_violation_access%' THEN RAISE WARNING '[Wave 162] Guard missing in % (violation)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (violation): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_violation_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- C6. Alert guard (p_alert_id)
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_alert_access(p_alert_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_alert_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_alert_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (alert); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_alert_access%' THEN RAISE WARNING '[Wave 162] Guard missing in % (alert)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (alert): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_alert_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- C7. Customer guard (p_customer_id → company ownership)
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_customer_access(p_customer_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_customer_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_customer_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_company_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (customer); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_customer_access%' THEN RAISE WARNING '[Wave 162] Guard missing in % (customer)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (customer): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_customer_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- ── D. Fix redistribute_portfolio impersonation (p_from_user_id not caught by Wave 156) ─
-- Wave 156 matched only `p_user_id %`; these use `p_from_user_id`.
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_self_user_id(p_from_user_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_from_user_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
      -- redistribute_admin_portfolio is handled below (service-role only)
      AND p.proname != 'redistribute_admin_portfolio'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 162] No BEGIN in % (from_user); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_self_user_id%' THEN RAISE WARNING '[Wave 162] Guard missing in % (from_user)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 162] EXECUTE failed % (from_user): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 162] assert_self_user_id(p_from_user_id) injected into % fns; % skipped', patched, skipped;
END;
$$;

-- ── E. Service-role-only lockdown for maintenance / automation functions ──────
-- These functions are called exclusively by cron jobs, automation engines, or
-- the migration runner — they must NEVER be invocable by end-users via REST.
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text :=
    chr(10) || '  IF auth.uid() IS NOT NULL THEN' ||
    chr(10) || '    RAISE EXCEPTION ''This function is reserved for the service role''' ||
    chr(10) || '      USING ERRCODE = ''insufficient_privilege'';' ||
    chr(10) || '  END IF;';
  patched int := 0; skipped int := 0;
  service_only_fns text[] := ARRAY[
    'seed_test_data',
    'redistribute_admin_portfolio',
    'archive_inactive_companies',
    'auto_assign_leads',
    'bulk_create_interactions',
    'check_sla_violations',
    'cleanup_old_audit_logs',
    'cleanup_old_data',
    'cleanup_old_notifications',
    'cleanup_orphan_data',
    'distribute_leads_round_robin',
    'find_duplicate_companies_by_cnpj',
    'fn_cf_collect_sm_legacy_harvest',
    'fn_ingest_asia_hg_batch',
    'fn_sm_promote_images_to_gold',
    'generate_auto_alerts',
    'generate_daily_alerts',
    'generate_historical_forecast',
    'generate_inactivity_alerts',
    'generate_reactivation_tasks',
    'generate_smart_alerts',
    'gerar_alertas_inativacao',
    'handle_webhook_event',
    'identify_cross_sell_opportunities',
    'identify_upsell_opportunities',
    'log_integration_action',
    'log_integration_event',
    'log_webhook_execution',
    'log_webhook_trigger',
    'normalize_cnpj_numbers',
    'normalize_phone_numbers',
    'process_scheduled_actions',
    'reset_daily_lead_counts',
    'save_cnpj_to_cache',
    'sync_interaction_from_zapp',
    'update_import_progress',
    'update_whatsapp_status'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND p.proname = ANY(service_only_fns)
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 162] No BEGIN in % (service-lock); skipped', r.proname;
      skipped := skipped+1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%auth.uid()%' THEN
      RAISE WARNING '[Wave 162] auth.uid() guard missing in % (service-lock)', r.proname; skipped := skipped+1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 162] EXECUTE failed % (service-lock): %', r.proname, SQLERRM; skipped := skipped+1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 162] Service-role-only guard applied to % functions; % skipped', patched, skipped;
END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE still_unguarded int;
BEGIN
  SELECT COUNT(*) INTO still_unguarded
  FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.prosecdef = true
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
    AND (
      pg_get_function_arguments(p.oid) LIKE '%p_visit_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_notification_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_proposal_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_goal_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_violation_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_alert_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_customer_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_from_user_id %'
      OR pg_get_function_arguments(p.oid) LIKE '%p_reminder_id %'
    )
    AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_%access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
    AND p.proname NOT LIKE 'singu_%';
  RAISE NOTICE '[Wave 162] Remaining unguarded entity-DML functions: %', still_unguarded;
END;
$$;
