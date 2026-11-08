CREATE OR REPLACE FUNCTION public.get_team_leaderboard(p_period text DEFAULT 'month'::text, p_limit integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, user_name text, interactions_count bigint, companies_new bigint, deals_won bigint, deals_value numeric, score numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date;
BEGIN
  v_start_date := CASE p_period
    WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
    ELSE CURRENT_DATE - INTERVAL '30 days'
  END;
  
  RETURN QUERY
  SELECT 
    pr.id as user_id,
    pr.full_name::text as user_name,
    (SELECT COUNT(*) FROM interactions i WHERE i.user_id = pr.id AND i.data_interacao >= v_start_date)::bigint as interactions_count,
    (SELECT COUNT(*) FROM companies c WHERE c.user_id = pr.id AND c.created_at >= v_start_date)::bigint as companies_new,
    (SELECT COUNT(*) FROM deals d WHERE d.user_id = pr.id AND d.status = 'ganho' AND d.updated_at >= v_start_date)::bigint as deals_won,
    (SELECT COALESCE(SUM(valor), 0) FROM deals d WHERE d.user_id = pr.id AND d.status = 'ganho' AND d.updated_at >= v_start_date)::numeric as deals_value,
    (
      (SELECT COUNT(*) FROM interactions i WHERE i.user_id = pr.id AND i.data_interacao >= v_start_date) * 1 +
      (SELECT COUNT(*) FROM companies c WHERE c.user_id = pr.id AND c.created_at >= v_start_date) * 5 +
      (SELECT COUNT(*) FROM deals d WHERE d.user_id = pr.id AND d.status = 'ganho' AND d.updated_at >= v_start_date) * 20
    )::numeric as score
  FROM profiles pr
  WHERE pr.is_active = true
  ORDER BY score DESC
  LIMIT p_limit;
END;
$function$
