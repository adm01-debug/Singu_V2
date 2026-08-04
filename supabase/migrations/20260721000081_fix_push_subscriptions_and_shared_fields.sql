-- Migration: fix_push_subscriptions_and_shared_fields (Wave 167)
-- SECURITY FIX: Two RLS policy defects found during Wave 166 audit:
--
-- 1. push_subscriptions_all (CRITICAL):
--    USING (auth.uid() IS NOT NULL) — only checks caller is logged in;
--    any authenticated user can read/write push subscriptions belonging
--    to other users (endpoint, p256dh key, auth key exposed).
--    Fix: drop the blanket policy, create per-operation user-scoped policies.
--
-- 2. custom_fields_select / custom_field_values_select (MEDIUM):
--    USING (auth.uid() = user_id) — misses rows where user_id IS NULL
--    (shared/global custom fields visible to all tenants).
--    Fix: drop and recreate with USING (user_id IS NULL OR user_id = auth.uid()).
--
-- All other 11 tables audited in Wave 166 already have correct policies.
-- login_attempts / password_reset_requests use RESTRICTIVE deny-all (correct).
-- ip_whitelist, lead_scores, sequences, webauthn_credentials use correct
-- "auth.uid() = user_id" guards.

-- ── 1. push_subscriptions ─────────────────────────────────────────────────────
-- Drop the dangerously permissive blanket policy
DROP POLICY IF EXISTS "push_subscriptions_all" ON public.push_subscriptions;

-- Create proper user-scoped CRUD policies
CREATE POLICY "push_subscriptions_user_select" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "push_subscriptions_user_insert" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_user_update" ON public.push_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subscriptions_user_delete" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── 2. custom_fields — fix SELECT to include shared/global rows ───────────────
-- Shared/global fields have user_id IS NULL; they must be readable by all
-- authenticated users (they define field schemas for the whole application).
DROP POLICY IF EXISTS "custom_fields_select" ON public.custom_fields;

CREATE POLICY "custom_fields_select" ON public.custom_fields
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- ── 3. custom_field_values — same nullable user_id fix ────────────────────────
DROP POLICY IF EXISTS "custom_field_values_select" ON public.custom_field_values;

CREATE POLICY "custom_field_values_select" ON public.custom_field_values
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  bad_push int;
  bad_cf   int;
  bad_cfv  int;
BEGIN
  -- 1. Verify push_subscriptions_all no longer exists
  SELECT COUNT(*) INTO bad_push
  FROM pg_policy pol
  JOIN pg_class cl ON pol.polrelid = cl.oid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public'
    AND cl.relname = 'push_subscriptions'
    AND pol.polname = 'push_subscriptions_all';

  IF bad_push = 0 THEN
    RAISE NOTICE '[Wave 167] push_subscriptions_all removed. Correct user-scoped policies in place.';
  ELSE
    RAISE WARNING '[Wave 167] push_subscriptions_all still exists!';
  END IF;

  -- 2. Verify custom_fields SELECT policy allows NULL user_id
  SELECT COUNT(*) INTO bad_cf
  FROM pg_policy pol
  JOIN pg_class cl ON pol.polrelid = cl.oid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public'
    AND cl.relname = 'custom_fields'
    AND pol.polname = 'custom_fields_select'
    AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%IS NULL%';

  IF bad_cf = 1 THEN
    RAISE NOTICE '[Wave 167] custom_fields_select now includes user_id IS NULL. Clean.';
  ELSE
    RAISE WARNING '[Wave 167] custom_fields_select may not have nullable user_id fix.';
  END IF;

  -- 3. Verify custom_field_values SELECT policy allows NULL user_id
  SELECT COUNT(*) INTO bad_cfv
  FROM pg_policy pol
  JOIN pg_class cl ON pol.polrelid = cl.oid
  JOIN pg_namespace ns ON ns.oid = cl.relnamespace
  WHERE ns.nspname = 'public'
    AND cl.relname = 'custom_field_values'
    AND pol.polname = 'custom_field_values_select'
    AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%IS NULL%';

  IF bad_cfv = 1 THEN
    RAISE NOTICE '[Wave 167] custom_field_values_select now includes user_id IS NULL. Clean.';
  ELSE
    RAISE WARNING '[Wave 167] custom_field_values_select may not have nullable user_id fix.';
  END IF;
END;
$$;
