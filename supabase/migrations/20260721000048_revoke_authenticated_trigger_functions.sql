-- Migration: revoke_authenticated_trigger_functions (Wave 134)
-- Revokes EXECUTE from `authenticated` on all SECURITY DEFINER trigger functions
-- in the public schema.
--
-- Trigger functions (returning trigger/event_trigger) are NEVER directly callable
-- by API users — they are only invoked by PostgreSQL internally when a DML
-- statement fires the associated trigger definition. Granting EXECUTE to
-- `authenticated` on these functions is therefore dead code and causes
-- `authenticated_security_definer_function_executable` advisory warnings.
--
-- Note: fn_set_novelty_updated_at() and fn_sync_novelty_to_product() were
-- already revoked in Wave 126 — they are omitted here to avoid errors.
--
-- The 11 trigger functions below were identified by querying:
--   SELECT p.proname FROM pg_proc p
--   JOIN pg_namespace n ON n.oid = p.pronamespace
--   JOIN pg_type t ON t.oid = p.prorettype
--   WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef = true
--     AND t.typname IN ('trigger', 'event_trigger')
--     AND p.proname NOT IN ('fn_set_novelty_updated_at', 'fn_sync_novelty_to_product')

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
        'REVOKE EXECUTE ON FUNCTION %s FROM authenticated',
        function_signature
      );
    END IF;
  END LOOP;
END;
$migration$;
