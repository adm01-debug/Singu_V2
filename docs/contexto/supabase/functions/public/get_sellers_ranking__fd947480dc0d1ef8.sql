CREATE OR REPLACE FUNCTION public.get_sellers_ranking(p_metric text DEFAULT 'revenue'::text, p_days integer DEFAULT 30)
 RETURNS TABLE(user_id uuid, user_name text, metric_value numeric, rank integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      sdm.user_id,
      p.full_name as user_name,
      CASE p_metric
        WHEN 'revenue' THEN SUM(sdm.revenue_generated)
        WHEN 'interactions' THEN SUM(sdm.interactions_count)::numeric
        WHEN 'deals_won' THEN SUM(sdm.deals_won)::numeric
        WHEN 'win_rate' THEN 
          CASE WHEN SUM(sdm.deals_won) + SUM(sdm.deals_lost) > 0
            THEN (SUM(sdm.deals_won)::numeric / (SUM(sdm.deals_won) + SUM(sdm.deals_lost)) * 100)
            ELSE 0
          END
        ELSE SUM(sdm.revenue_generated)
      END as metric_value
    FROM seller_daily_metrics sdm
    JOIN profiles p ON p.id = sdm.user_id
    WHERE sdm.metric_date >= CURRENT_DATE - p_days
    GROUP BY sdm.user_id, p.full_name
  )
  SELECT 
    m.user_id,
    m.user_name,
    ROUND(m.metric_value, 2),
    ROW_NUMBER() OVER (ORDER BY m.metric_value DESC)::integer
  FROM metrics m
  ORDER BY m.metric_value DESC;
END;
$function$
