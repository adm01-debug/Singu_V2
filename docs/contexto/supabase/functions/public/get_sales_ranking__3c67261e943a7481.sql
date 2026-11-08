CREATE OR REPLACE FUNCTION public.get_sales_ranking(p_period_days integer DEFAULT 30, p_metric text DEFAULT 'revenue'::text)
 RETURNS TABLE(ranking integer, user_id uuid, user_name text, metric_value numeric, deals_won integer, revenue numeric, activities integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date := CURRENT_DATE - p_period_days;
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      p.id as uid,
      COALESCE(p.full_name, p.email)::text as uname,
      COALESCE((SELECT COUNT(*) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= v_start_date), 0)::int as dw,
      COALESCE((SELECT SUM(valor) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= v_start_date), 0)::numeric as rv,
      COALESCE((SELECT COUNT(*) FROM interactions i JOIN companies c ON c.id = i.company_id WHERE c.user_id = p.id AND i.data_interacao >= v_start_date), 0)::int as act
    FROM profiles p
    WHERE p.is_active = true
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY 
      CASE p_metric 
        WHEN 'revenue' THEN us.rv
        WHEN 'deals' THEN us.dw::numeric
        WHEN 'activities' THEN us.act::numeric
        ELSE us.rv
      END DESC
    )::int as ranking,
    us.uid as user_id,
    us.uname as user_name,
    CASE p_metric 
      WHEN 'revenue' THEN us.rv
      WHEN 'deals' THEN us.dw::numeric
      WHEN 'activities' THEN us.act::numeric
      ELSE us.rv
    END as metric_value,
    us.dw as deals_won,
    us.rv as revenue,
    us.act as activities
  FROM user_stats us
  ORDER BY ranking
  LIMIT 20;
END;
$function$
