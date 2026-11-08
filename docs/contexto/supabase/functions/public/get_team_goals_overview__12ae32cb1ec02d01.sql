CREATE OR REPLACE FUNCTION public.get_team_goals_overview()
 RETURNS TABLE(user_name text, goal_type text, target numeric, current numeric, pct_achieved numeric, status text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = g.user_id),
    g.goal_type, g.target_value, g.current_value,
    ROUND(g.current_value / NULLIF(g.target_value, 0) * 100, 1),
    CASE 
      WHEN g.is_achieved THEN 'Atingida'
      WHEN g.current_value >= g.target_value * 0.8 THEN 'No Caminho'
      WHEN g.current_value >= g.target_value * 0.5 THEN 'Atenção'
      ELSE 'Em Risco'
    END
  FROM user_goals g WHERE g.period_end >= CURRENT_DATE
  ORDER BY 5 DESC;
$function$
