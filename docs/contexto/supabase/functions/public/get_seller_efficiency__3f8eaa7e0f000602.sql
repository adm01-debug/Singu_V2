CREATE OR REPLACE FUNCTION public.get_seller_efficiency(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'interactions_per_deal', (SELECT ROUND(COUNT(i.id)::numeric / NULLIF((SELECT COUNT(*) FROM deals d WHERE d.user_id = p_user_id AND d.status = 'ganho'), 0), 1) FROM interactions i WHERE i.user_id = p_user_id),
    'avg_cycle_days', (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 1) FROM deals WHERE user_id = p_user_id AND status = 'ganho'),
    'conversion_rate', (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE user_id = p_user_id),
    'revenue_per_interaction', (SELECT ROUND(COALESCE(SUM(d.valor), 0) / NULLIF((SELECT COUNT(*) FROM interactions i WHERE i.user_id = p_user_id), 0), 2) FROM deals d WHERE d.user_id = p_user_id AND d.status = 'ganho'),
    'active_portfolio', (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND deleted_at IS NULL),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status NOT IN ('ganho', 'perdido'))
  );
END;
$function$
