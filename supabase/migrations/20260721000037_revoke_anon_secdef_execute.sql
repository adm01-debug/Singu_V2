-- Migration: revoke_anon_secdef_execute (Wave 123)
-- 7 SECURITY DEFINER functions were callable by the unauthenticated `anon`
-- role via the REST API. None of them should be publicly accessible without
-- authentication. Revoking EXECUTE from anon closes the attack surface.
-- (Authenticated users retain access where needed.)

REVOKE EXECUTE ON FUNCTION public.create_deal(
  p_company_id uuid,
  p_titulo text,
  p_valor numeric,
  p_pipeline_stage text,
  p_previsao_fechamento date,
  p_contact_id uuid
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.fn_cf_collect_sm_legacy_dispatch(
  p_start_page integer,
  p_end_page integer
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.fn_cf_collect_sm_legacy_harvest(
  p_first_id bigint,
  p_last_id bigint
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.fn_ingest_asia_hg_batch(
  p_produtos jsonb
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.fn_set_novelty_updated_at() FROM anon;

REVOKE EXECUTE ON FUNCTION public.fn_sm_promote_images_to_gold(
  p_limit integer
) FROM anon;

REVOKE EXECUTE ON FUNCTION public.fn_sync_novelty_to_product() FROM anon;
