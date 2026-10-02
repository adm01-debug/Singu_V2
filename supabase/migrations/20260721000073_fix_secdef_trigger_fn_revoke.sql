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

DO $migration$
DECLARE
  function_signature text;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    'public.audit_companies_trigger()',
    'public.audit_trigger_fn()',
    'public.audit_trigger_func()',
    'public.auto_calculate_lead_score()',
    'public.companies_search_vector_update()',
    'public.fn_set_novelty_updated_at()',
    'public.fn_sync_novelty_to_product()',
    'public.handle_new_singu_profile()',
    'public.handle_new_user()',
    'public.log_deal_status_change()',
    'public.mark_customer_on_deal_won()',
    'public.set_updated_at()',
    'public.singu_audit_trigger_fn()'
  ]
  LOOP
    IF to_regprocedure(function_signature) IS NOT NULL THEN
      EXECUTE format(
        'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated',
        function_signature
      );
    END IF;
  END LOOP;

  function_signature := 'public.get_singu_allowed_tables()';
  IF to_regprocedure(function_signature) IS NOT NULL THEN
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon',
      function_signature
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO service_role',
      function_signature
    );
  END IF;
END;
$migration$;

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
