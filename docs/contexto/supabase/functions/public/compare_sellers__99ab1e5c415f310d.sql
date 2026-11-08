CREATE OR REPLACE FUNCTION public.compare_sellers(p_user_ids uuid[], p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT jsonb_agg(s)
    FROM (
      SELECT 
        sdm.user_id,
        p.full_name,
        SUM(sdm.interactions_count) as total_interactions,
        SUM(sdm.revenue_generated) as total_revenue,
        SUM(sdm.deals_won) as deals_won,
        SUM(sdm.deals_lost) as deals_lost,
        ROUND(
          CASE WHEN SUM(sdm.deals_won) + SUM(sdm.deals_lost) > 0
            THEN (SUM(sdm.deals_won)::numeric / (SUM(sdm.deals_won) + SUM(sdm.deals_lost)) * 100)
            ELSE 0
          END, 1
        ) as win_rate
      FROM seller_daily_metrics sdm
      JOIN profiles p ON p.id = sdm.user_id
      WHERE sdm.user_id = ANY(p_user_ids)
        AND sdm.metric_date >= CURRENT_DATE - p_days
      GROUP BY sdm.user_id, p.full_name
    ) s
  );
END;
$function$
