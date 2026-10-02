-- Migration: revoke_authenticated_internal_functions (Wave 126)
-- The authenticated_security_definer_function_executable advisor warns about
-- SECURITY DEFINER functions callable by signed-in users. For business-logic
-- functions this is intentional, but several functions are internal pipeline /
-- system-only operations that no authenticated user should invoke directly.
-- These are called exclusively by cron jobs, edge functions, or service_role.
-- Revoking EXECUTE from `authenticated` (and confirming anon was already
-- revoked in Wave 123) closes the attack surface on these internal functions.

DO $migration$
DECLARE
  function_signature text;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    'public.fn_cf_collect_sm_legacy_dispatch(integer,integer)',
    'public.fn_cf_collect_sm_legacy_harvest(bigint,bigint)',
    'public.fn_ingest_asia_hg_batch(jsonb)',
    'public.fn_set_novelty_updated_at()',
    'public.fn_sm_promote_images_to_gold(integer)',
    'public.fn_sync_novelty_to_product()',
    'public.fn_promote_kit_components_batch(integer)',
    'public.fn_apply_auto_tag_rules(uuid)',
    'public.redistribute_admin_portfolio(uuid,uuid[],integer)',
    'public.validate_data_batch(text)',
    'public.get_data_cleanup_tasks()'
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
