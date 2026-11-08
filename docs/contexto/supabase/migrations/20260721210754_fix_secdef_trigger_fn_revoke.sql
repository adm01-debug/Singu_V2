-- Migration: fix_secdef_trigger_fn_revoke (Wave 159)
-- SECURITY FIX: 13 SECURITY DEFINER trigger functions in the public schema
-- have EXECUTE accessible to PUBLIC/anon/authenticated via the default
-- PostgreSQL privilege model.
--
-- Trigger functions (RETURNS trigger) are called exclusively by the PostgreSQL
-- trigger machinery — they should NEVER be invocable directly by any user role.
-- Revoking EXECUTE from PUBLIC, anon, and authenticated:
--   • Eliminates the Supabase advisor lint for these functions
--   • Prevents any possibility of direct REST-API invocation
--   • Does NOT affect trigger execution (triggers are called as postgres/owner)
--
-- Also revokes PUBLIC/anon from internal helper get_singu_allowed_tables,
-- which is an implementation detail of singu_* functions and never meant
-- for direct user calls.

-- ── Trigger functions ─────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.audit_companies_trigger()     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_trigger_fn()           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_trigger_func()         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_calculate_lead_score()  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.companies_search_vector_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_set_novelty_updated_at()  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_sync_novelty_to_product() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_singu_profile()   FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user()            FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_deal_status_change()     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_customer_on_deal_won()  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at()             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.singu_audit_trigger_fn()     FROM PUBLIC, anon, authenticated;

-- ── Internal helpers ──────────────────────────────────────────────────────────
-- get_singu_allowed_tables is called internally by singu_* SECURITY DEFINER
-- functions; direct user calls return no sensitive data but are pointless.
REVOKE ALL ON FUNCTION public.get_singu_allowed_tables() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_singu_allowed_tables() TO service_role;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  accessible_trigger_fns int;
BEGIN
  -- Check if any trigger-return SECURITY DEFINER functions still have
  -- EXECUTE granted to authenticated/anon
  SELECT COUNT(*) INTO accessible_trigger_fns
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prorettype = 'pg_catalog.trigger'::regtype
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');

  IF accessible_trigger_fns > 0 THEN
    RAISE WARNING '[Wave 159] % trigger functions still accessible to authenticated', accessible_trigger_fns;
  ELSE
    RAISE NOTICE '[Wave 159] All trigger SECURITY DEFINER functions locked down. Clean.';
  END IF;
END;
$$;
