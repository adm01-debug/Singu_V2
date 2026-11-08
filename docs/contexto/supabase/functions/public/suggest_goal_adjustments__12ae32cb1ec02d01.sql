CREATE OR REPLACE FUNCTION public.suggest_goal_adjustments()
 RETURNS TABLE(user_name text, goal_type text, current_target numeric, suggested_target numeric, reason text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = g.user_id),
    g.goal_type, g.target_value,
    CASE 
      WHEN g.current_value > g.target_value THEN g.target_value * 1.2
      WHEN g.current_value < g.target_value * 0.3 AND g.period_end - CURRENT_DATE < 10 THEN g.target_value * 0.7
      ELSE g.target_value
    END,
    CASE 
      WHEN g.current_value > g.target_value THEN 'Meta já atingida - aumentar desafio'
      WHEN g.current_value < g.target_value * 0.3 AND g.period_end - CURRENT_DATE < 10 THEN 'Meta muito distante - revisar'
      ELSE 'Manter'
    END
  FROM user_goals g WHERE g.period_end >= CURRENT_DATE
    AND (g.current_value > g.target_value OR (g.current_value < g.target_value * 0.3 AND g.period_end - CURRENT_DATE < 10));
$function$
