CREATE OR REPLACE FUNCTION public.get_target_vs_actual(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(user_name text, target_revenue numeric, actual_revenue numeric, pct_achieved numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(p.full_name, p.email),
    COALESCE((SELECT target_value FROM user_goals g WHERE g.user_id = p.id AND g.goal_type = 'deals_value' AND g.period_end >= CURRENT_DATE LIMIT 1), 0),
    COALESCE((SELECT SUM(d.valor) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= DATE_TRUNC('month', NOW())), 0),
    ROUND(COALESCE((SELECT SUM(d.valor) FROM deals d WHERE d.user_id = p.id AND d.status = 'ganho' AND d.closed_at >= DATE_TRUNC('month', NOW())), 0) / 
      NULLIF((SELECT target_value FROM user_goals g WHERE g.user_id = p.id AND g.goal_type = 'deals_value' LIMIT 1), 0) * 100, 1)
  FROM profiles p WHERE p.is_active = true AND (p_user_id IS NULL OR p.id = p_user_id) ORDER BY 3 DESC;
$function$
