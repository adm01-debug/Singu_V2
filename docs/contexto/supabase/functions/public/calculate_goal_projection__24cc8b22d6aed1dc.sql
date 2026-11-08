CREATE OR REPLACE FUNCTION public.calculate_goal_projection(p_user_id uuid, p_goal_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_goal RECORD; v_daily_rate numeric; v_days_remaining int; v_projected numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT * INTO v_goal FROM user_goals WHERE user_id = p_user_id AND goal_type = p_goal_type AND period_end >= CURRENT_DATE ORDER BY period_end LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Meta não encontrada'); END IF;
  
  v_days_remaining := v_goal.period_end - CURRENT_DATE;
  IF v_days_remaining <= 0 THEN v_days_remaining := 1; END IF;
  
  v_daily_rate := v_goal.current_value / NULLIF(CURRENT_DATE - v_goal.period_start, 0);
  v_projected := v_goal.current_value + (v_daily_rate * v_days_remaining);
  
  RETURN jsonb_build_object(
    'goal_type', v_goal.goal_type,
    'target', v_goal.target_value,
    'current', v_goal.current_value,
    'projected', ROUND(v_projected, 2),
    'daily_rate', ROUND(v_daily_rate, 2),
    'days_remaining', v_days_remaining,
    'on_track', v_projected >= v_goal.target_value,
    'gap', v_goal.target_value - v_goal.current_value,
    'required_daily', ROUND((v_goal.target_value - v_goal.current_value) / NULLIF(v_days_remaining, 0), 2)
  );
END;
$function$
