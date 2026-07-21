-- Migration: revoke_authenticated_internal_functions (Wave 126)
-- The authenticated_security_definer_function_executable advisor warns about
-- SECURITY DEFINER functions callable by signed-in users. For business-logic
-- functions this is intentional, but several functions are internal pipeline /
-- system-only operations that no authenticated user should invoke directly.
-- These are called exclusively by cron jobs, edge functions, or service_role.
-- Revoking EXECUTE from `authenticated` (and confirming anon was already
-- revoked in Wave 123) closes the attack surface on these internal functions.

-- ── Internal data collection / ingestion pipelines ───────────────────────────
REVOKE EXECUTE ON FUNCTION public.fn_cf_collect_sm_legacy_dispatch(
  p_start_page integer, p_end_page integer
) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_cf_collect_sm_legacy_harvest(
  p_first_id bigint, p_last_id bigint
) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_ingest_asia_hg_batch(
  p_produtos jsonb
) FROM authenticated;

-- ── Internal sync / promotion pipelines ──────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.fn_set_novelty_updated_at() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_sm_promote_images_to_gold(
  p_limit integer
) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_sync_novelty_to_product() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.fn_promote_kit_components_batch(
  p_batch_size integer
) FROM authenticated;

-- ── Internal product tagging pipeline ────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.fn_apply_auto_tag_rules(
  p_product_id uuid
) FROM authenticated;

-- ── Admin-only portfolio redistribution ──────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.redistribute_admin_portfolio(
  p_admin_id uuid, p_target_users uuid[], p_batch_size integer
) FROM authenticated;

-- ── Internal data maintenance utilities ──────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.validate_data_batch(
  p_table text
) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.get_data_cleanup_tasks() FROM authenticated;
