-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194814
-- nome:   revoke_authenticated_internal_functions

REVOKE EXECUTE ON FUNCTION public.fn_cf_collect_sm_legacy_dispatch(p_start_page integer, p_end_page integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_cf_collect_sm_legacy_harvest(p_first_id bigint, p_last_id bigint) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_ingest_asia_hg_batch(p_produtos jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_set_novelty_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_sm_promote_images_to_gold(p_limit integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_sync_novelty_to_product() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_promote_kit_components_batch(p_batch_size integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_apply_auto_tag_rules(p_product_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.redistribute_admin_portfolio(p_admin_id uuid, p_target_users uuid[], p_batch_size integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_data_batch(p_table text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_data_cleanup_tasks() FROM authenticated;
