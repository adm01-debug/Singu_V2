CREATE OR REPLACE FUNCTION public.get_weekly_top_performers()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'top_revenue', (
      SELECT COALESCE(jsonb_agg(r), '[]')
      FROM (
        SELECT p.full_name, SUM(sdm.revenue_generated) as revenue
        FROM seller_daily_metrics sdm
        JOIN profiles p ON p.id = sdm.user_id
        WHERE sdm.metric_date >= CURRENT_DATE - 7
        GROUP BY p.full_name
        ORDER BY revenue DESC
        LIMIT 3
      ) r
    ),
    'top_interactions', (
      SELECT COALESCE(jsonb_agg(r), '[]')
      FROM (
        SELECT p.full_name, SUM(sdm.interactions_count) as interactions
        FROM seller_daily_metrics sdm
        JOIN profiles p ON p.id = sdm.user_id
        WHERE sdm.metric_date >= CURRENT_DATE - 7
        GROUP BY p.full_name
        ORDER BY interactions DESC
        LIMIT 3
      ) r
    ),
    'top_deals', (
      SELECT COALESCE(jsonb_agg(r), '[]')
      FROM (
        SELECT p.full_name, SUM(sdm.deals_won) as deals
        FROM seller_daily_metrics sdm
        JOIN profiles p ON p.id = sdm.user_id
        WHERE sdm.metric_date >= CURRENT_DATE - 7
        GROUP BY p.full_name
        ORDER BY deals DESC
        LIMIT 3
      ) r
    )
  );
END;
$function$
