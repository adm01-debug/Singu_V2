CREATE OR REPLACE FUNCTION public.get_complete_dashboard(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'generated_at', NOW(),
    'user_id', p_user_id,
    'overview', jsonb_build_object(
      'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND (p_user_id IS NULL OR user_id = p_user_id)),
      'total_customers', (SELECT COUNT(*) FROM companies WHERE is_customer = true AND deleted_at IS NULL AND (p_user_id IS NULL OR user_id = p_user_id)),
      'open_pipeline', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND (p_user_id IS NULL OR user_id = p_user_id)),
      'monthly_revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW()) AND (p_user_id IS NULL OR user_id = p_user_id))
    ),
    'pipeline', jsonb_build_object(
      'total_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND (p_user_id IS NULL OR user_id = p_user_id)),
      'total_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND (p_user_id IS NULL OR user_id = p_user_id)),
      'weighted', (SELECT COALESCE(SUM(valor * COALESCE(probabilidade, 50) / 100), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND (p_user_id IS NULL OR user_id = p_user_id)),
      'stalled', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '7 days' AND (p_user_id IS NULL OR user_id = p_user_id))
    ),
    'activity', jsonb_build_object(
      'today', (SELECT COUNT(*) FROM interactions WHERE data_interacao::date = CURRENT_DATE AND (p_user_id IS NULL OR user_id = p_user_id)),
      'week', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('week', NOW()) AND (p_user_id IS NULL OR user_id = p_user_id)),
      'month', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= DATE_TRUNC('month', NOW()) AND (p_user_id IS NULL OR user_id = p_user_id))
    ),
    'conversion', jsonb_build_object(
      'rate', (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE (p_user_id IS NULL OR user_id = p_user_id)),
      'won_this_month', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW()) AND (p_user_id IS NULL OR user_id = p_user_id)),
      'lost_this_month', (SELECT COUNT(*) FROM deals WHERE status = 'perdido' AND closed_at >= DATE_TRUNC('month', NOW()) AND (p_user_id IS NULL OR user_id = p_user_id))
    ),
    'alerts_count', (SELECT COUNT(*) FROM (SELECT * FROM get_business_alerts() WHERE severity IN ('CRÍTICO', 'ALTO')) sub)
  );
END;
$function$
