-- Migration: fix_auth_rls_initplan (Wave 169)

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

-- ── 2. custom_fields ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "custom_fields_select" ON public.custom_fields;

CREATE POLICY "custom_fields_select" ON public.custom_fields
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = (SELECT auth.uid()));

-- ── 3. custom_field_values ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "custom_field_values_select" ON public.custom_field_values;

CREATE POLICY "custom_field_values_select" ON public.custom_field_values
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = (SELECT auth.uid()));

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  initplan_count int;
BEGIN
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
