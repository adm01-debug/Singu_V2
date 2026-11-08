CREATE OR REPLACE FUNCTION public.get_goals_ranking(p_goal_type text, p_period_type text DEFAULT 'monthly'::text)
 RETURNS TABLE(rank integer, user_id uuid, user_name text, current_value numeric, target_value numeric, progress_pct numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY g.current_value DESC)::int,
    g.user_id, COALESCE(p.full_name, p.email), g.current_value, g.target_value,
    ROUND(CASE WHEN g.target_value > 0 THEN (g.current_value / g.target_value * 100) ELSE 0 END, 1)
  FROM user_goals g
  JOIN profiles p ON p.id = g.user_id
  WHERE g.goal_type = p_goal_type AND g.period_type = p_period_type AND g.period_end >= CURRENT_DATE
  ORDER BY g.current_value DESC;
$function$
