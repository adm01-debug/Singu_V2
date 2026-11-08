CREATE OR REPLACE FUNCTION public.get_performance_benchmark(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'user_metrics', jsonb_build_object(
      'conversion_rate', (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals WHERE user_id = p_user_id),
      'avg_ticket', (SELECT ROUND(AVG(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho'),
      'avg_cycle', (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho'),
      'monthly_interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao >= DATE_TRUNC('month', NOW()))
    ),
    'team_avg', jsonb_build_object(
      'conversion_rate', (SELECT ROUND(COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) * 100, 1) FROM deals),
      'avg_ticket', (SELECT ROUND(AVG(valor), 0) FROM deals WHERE status = 'ganho'),
      'avg_cycle', (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400), 0) FROM deals WHERE status = 'ganho'),
      'monthly_interactions', (SELECT ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(DISTINCT user_id) FROM interactions WHERE data_interacao >= DATE_TRUNC('month', NOW())), 0), 0) FROM interactions WHERE data_interacao >= DATE_TRUNC('month', NOW()))
    ),
    'position', jsonb_build_object(
      'rank_conversion', (SELECT COUNT(*) + 1 FROM (SELECT user_id, COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) as rate FROM deals GROUP BY user_id) sub WHERE rate > (SELECT COUNT(*) FILTER (WHERE status = 'ganho')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) FROM deals WHERE user_id = p_user_id)),
      'rank_revenue', (SELECT COUNT(*) + 1 FROM (SELECT user_id, SUM(valor) as rev FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW()) GROUP BY user_id) sub WHERE rev > (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())))
    )
  ) INTO v_result;
  RETURN v_result;
END;
$function$
