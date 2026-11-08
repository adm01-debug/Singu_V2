CREATE OR REPLACE FUNCTION public.get_user_goals_dashboard(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Atualizar progresso primeiro
  PERFORM update_user_goals_progress(p_user_id);
  
  RETURN (
    SELECT jsonb_build_object(
      'active_goals', (
        SELECT jsonb_agg(jsonb_build_object(
          'id', id,
          'type', goal_type,
          'target', target_value,
          'current', current_value,
          'progress_pct', ROUND((current_value / NULLIF(target_value, 0)) * 100, 1),
          'period', period_type,
          'is_achieved', is_achieved,
          'days_remaining', period_end - CURRENT_DATE
        ))
        FROM user_goals
        WHERE user_id = p_user_id AND CURRENT_DATE BETWEEN period_start AND period_end
      ),
      'achieved_this_month', (
        SELECT COUNT(*) FROM user_goals
        WHERE user_id = p_user_id AND is_achieved = true AND achieved_at >= DATE_TRUNC('month', CURRENT_DATE)
      ),
      'updated_at', NOW()
    )
  );
END;
$function$
