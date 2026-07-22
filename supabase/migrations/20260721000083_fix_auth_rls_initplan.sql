-- Migration: fix_auth_rls_initplan (Wave 169)
-- PERFORMANCE FIX: 6 RLS policies created in Wave 167 use bare auth.uid()
-- instead of (SELECT auth.uid()). PostgreSQL treats bare auth.uid() calls in
-- USING/WITH CHECK as an "initplan" — re-evaluated once per row scanned,
-- not once per query. This causes full sequential scans on large tables.
--
-- Fix: DROP and recreate each policy with (SELECT auth.uid()) which is evaluated
-- once per query and cached, enabling index-only scans on user_id.
--
-- Affected policies (all created in Wave 167):
--   push_subscriptions: user_select, user_insert, user_update, user_delete
--   custom_fields:      custom_fields_select
--   custom_field_values: custom_field_values_select

-- ── 1. push_subscriptions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "push_subscriptions_user_select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_user_insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_user_update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_user_delete" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_user_select" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "push_subscriptions_user_insert" ON public.push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "push_subscriptions_user_update" ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "push_subscriptions_user_delete" ON public.push_subscriptions
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ── 2. custom_fields — fix SELECT to use subselect + include nullable user_id ──
DROP POLICY IF EXISTS "custom_fields_select" ON public.custom_fields;

CREATE POLICY "custom_fields_select" ON public.custom_fields
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = (SELECT auth.uid()));

-- ── 3. custom_field_values — same fix ─────────────────────────────────────────
DROP POLICY IF EXISTS "custom_field_values_select" ON public.custom_field_values;

CREATE POLICY "custom_field_values_select" ON public.custom_field_values
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = (SELECT auth.uid()));

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  initplan_count int;
BEGIN
  -- Count policies in public schema that still use bare auth.uid() without SELECT
  -- (pg_get_expr renders the stored expression; bare auth.uid() appears as
  --  "auth.uid()" while the subselect form appears as "(SELECT auth.uid() AS uid)")
  SELECT COUNT(*) INTO initplan_count
  FROM pg_policy pol
  JOIN pg_class cl ON pol.polrelid = cl.oid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
  WHERE (
    pg_get_expr(pol.polqual, pol.polrelid) LIKE '%auth.uid()%'
    OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%auth.uid()%'
  )
  AND NOT (
    pg_get_expr(pol.polqual, pol.polrelid) LIKE '%(SELECT auth.uid()%'
    OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%(SELECT auth.uid()%'
  );

  IF initplan_count = 0 THEN
    RAISE NOTICE '[Wave 169] All RLS policies now use (SELECT auth.uid()). initplan eliminated.';
  ELSE
    RAISE WARNING '[Wave 169] % policies still use bare auth.uid() (potential initplan)', initplan_count;
  END IF;
END;
$$;
