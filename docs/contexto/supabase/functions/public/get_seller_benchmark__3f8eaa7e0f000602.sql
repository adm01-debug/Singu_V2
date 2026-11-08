CREATE OR REPLACE FUNCTION public.get_seller_benchmark(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_metrics jsonb;
  v_team_avg jsonb;
  v_ranking int;
  v_total_sellers int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Métricas do usuário
  SELECT jsonb_build_object(
    'deals_won', COUNT(*) FILTER (WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)),
    'revenue', COALESCE(SUM(valor) FILTER (WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)), 0),
    'interactions', (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao >= DATE_TRUNC('month', CURRENT_DATE)),
    'pipeline_value', COALESCE(SUM(valor) FILTER (WHERE status NOT IN ('ganho', 'perdido')), 0)
  ) INTO v_user_metrics
  FROM deals WHERE user_id = p_user_id;
  
  -- Média do time
  SELECT jsonb_build_object(
    'avg_deals_won', ROUND(AVG(deals_won), 1),
    'avg_revenue', ROUND(AVG(revenue), 2),
    'avg_interactions', ROUND(AVG(interactions), 1)
  ) INTO v_team_avg
  FROM (
    SELECT 
      user_id,
      COUNT(*) FILTER (WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)) as deals_won,
      COALESCE(SUM(valor) FILTER (WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as revenue,
      (SELECT COUNT(*) FROM interactions i WHERE i.user_id = d.user_id AND i.data_interacao >= DATE_TRUNC('month', CURRENT_DATE)) as interactions
    FROM deals d
    GROUP BY user_id
  ) sellers;
  
  -- Ranking
  SELECT COUNT(*) INTO v_total_sellers FROM profiles WHERE is_active = true;
  SELECT position INTO v_ranking
  FROM (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY SUM(valor) DESC) as position
    FROM deals WHERE status = 'ganho' AND closed_at >= DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY user_id
  ) r WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'your_metrics', v_user_metrics,
    'team_average', v_team_avg,
    'ranking', COALESCE(v_ranking, v_total_sellers),
    'total_sellers', v_total_sellers,
    'percentile', ROUND((1 - (COALESCE(v_ranking, v_total_sellers)::numeric / NULLIF(v_total_sellers, 0))) * 100, 0),
    'vs_average', jsonb_build_object(
      'revenue_diff', ROUND((v_user_metrics->>'revenue')::numeric - (v_team_avg->>'avg_revenue')::numeric, 2),
      'deals_diff', (v_user_metrics->>'deals_won')::int - ROUND((v_team_avg->>'avg_deals_won')::numeric, 0)::int
    )
  );
END;
$function$
