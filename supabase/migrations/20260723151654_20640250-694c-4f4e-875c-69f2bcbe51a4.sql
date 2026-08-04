-- Rodada 47/10 — Least Privilege para FUNCTIONS em public.*
-- 1) Revogar EXECUTE de trigger functions (nunca devem ser callable via API)
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_system_config() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_bpr_queue_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_entity_relationship() FROM anon, authenticated, PUBLIC;

-- 2) Revogar EXECUTE de funções de infraestrutura que só service_role deve chamar
REVOKE EXECUTE ON FUNCTION public.cleanup_behavioral_regen_queue(integer, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_webhook_quota(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.publish_mtta_sla_breach_alert(integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_daily_lead_counts() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_attribution(text, text, numeric) FROM anon, authenticated, PUBLIC;

-- 3) Garantir service_role em todas
GRANT EXECUTE ON FUNCTION public.tg_set_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.touch_system_config() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_bpr_queue_updated_at() TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_entity_relationship() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_behavioral_regen_queue(integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_webhook_quota(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.publish_mtta_sla_breach_alert(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_daily_lead_counts() TO service_role;
GRANT EXECUTE ON FUNCTION public.compute_attribution(text, text, numeric) TO service_role;