CREATE OR REPLACE FUNCTION public.get_team_ranking(p_period_start date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_period_end date DEFAULT CURRENT_DATE, p_metric text DEFAULT 'interactions'::text)
 RETURNS TABLE(rank integer, user_id uuid, user_name text, metric_value bigint, delta_vs_avg numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH metrics AS (
    SELECT 
      p.id as user_id,
      p.full_name as user_name,
      CASE p_metric
        WHEN 'interactions' THEN (
          SELECT COUNT(*) FROM interactions i 
          WHERE i.user_id = p.id AND i.created_at::date BETWEEN p_period_start AND p_period_end
        )
        WHEN 'companies' THEN (
          SELECT COUNT(*) FROM companies c 
          WHERE c.user_id = p.id AND c.created_at::date BETWEEN p_period_start AND p_period_end
        )
        ELSE (
          SELECT COUNT(*) FROM interactions i 
          WHERE i.user_id = p.id AND i.created_at::date BETWEEN p_period_start AND p_period_end
        )
      END as metric_value
    FROM profiles p
    WHERE p.id IN (SELECT DISTINCT user_id FROM interactions WHERE created_at >= NOW() - interval '90 days')
  ),
  avg_metric AS (
    SELECT AVG(metric_value)::numeric as avg_val FROM metrics WHERE metric_value > 0
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY m.metric_value DESC)::int as rank,
    m.user_id,
    m.user_name,
    m.metric_value,
    ROUND((m.metric_value - a.avg_val) / NULLIF(a.avg_val, 0) * 100, 2) as delta_vs_avg
  FROM metrics m
  CROSS JOIN avg_metric a
  WHERE m.metric_value > 0
  ORDER BY m.metric_value DESC;
END;
$function$
