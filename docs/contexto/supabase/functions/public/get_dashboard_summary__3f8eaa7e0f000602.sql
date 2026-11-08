CREATE OR REPLACE FUNCTION public.get_dashboard_summary(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
    'active_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND status = 'ativo'),
    'customers', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND is_customer = true),
    'leads', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND is_customer = false),
    'total_deals', (SELECT COUNT(*) FROM deals),
    'open_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'won_deals', (SELECT COUNT(*) FROM deals WHERE status = 'ganho'),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'won_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho'),
    'interactions_today', (SELECT COUNT(*) FROM interactions WHERE data_interacao::date = CURRENT_DATE),
    'interactions_week', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('week', CURRENT_DATE)),
    'contacts', (SELECT COUNT(*) FROM contacts)
  );
END;
$function$
