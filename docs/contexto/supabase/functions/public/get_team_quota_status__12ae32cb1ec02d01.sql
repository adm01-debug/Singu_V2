CREATE OR REPLACE FUNCTION public.get_team_quota_status()
 RETURNS TABLE(user_name text, quota numeric, achieved numeric, pct_achieved numeric, status text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(p.full_name, p.email),
    COALESCE((SELECT target_value FROM user_goals WHERE user_id = p.id AND goal_type = 'revenue' AND period_end >= CURRENT_DATE LIMIT 1), 100000),
    (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())),
    ROUND((SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())) / 
      NULLIF(COALESCE((SELECT target_value FROM user_goals WHERE user_id = p.id AND goal_type = 'revenue' AND period_end >= CURRENT_DATE LIMIT 1), 100000), 0) * 100, 1),
    CASE 
      WHEN (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())) >= 
        COALESCE((SELECT target_value FROM user_goals WHERE user_id = p.id AND goal_type = 'revenue' AND period_end >= CURRENT_DATE LIMIT 1), 100000) THEN '🏆 Atingida'
      WHEN (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p.id AND status = 'ganho' AND closed_at >= DATE_TRUNC('month', NOW())) >= 
        COALESCE((SELECT target_value FROM user_goals WHERE user_id = p.id AND goal_type = 'revenue' AND period_end >= CURRENT_DATE LIMIT 1), 100000) * 0.7 THEN '✅ No Caminho'
      ELSE '⚠️ Atenção'
    END
  FROM profiles p WHERE p.is_active = true ORDER BY 4 DESC;
$function$
