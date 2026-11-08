CREATE OR REPLACE FUNCTION public.calculate_goal_progress(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_goal user_goals%ROWTYPE;
  v_value numeric;
  v_updated int := 0;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  FOR v_goal IN SELECT * FROM user_goals WHERE user_id = p_user_id AND period_end >= CURRENT_DATE
  LOOP
    v_value := CASE v_goal.goal_type
      WHEN 'deals_value' THEN (
        SELECT COALESCE(SUM(valor), 0) FROM deals 
        WHERE user_id = p_user_id AND status = 'ganho' 
          AND closed_at BETWEEN v_goal.period_start AND v_goal.period_end
      )
      WHEN 'deals_count' THEN (
        SELECT COUNT(*) FROM deals 
        WHERE user_id = p_user_id AND status = 'ganho' 
          AND closed_at BETWEEN v_goal.period_start AND v_goal.period_end
      )
      WHEN 'interactions' THEN (
        SELECT COUNT(*) FROM interactions 
        WHERE user_id = p_user_id 
          AND data_interacao BETWEEN v_goal.period_start AND v_goal.period_end + 1
      )
      WHEN 'new_companies' THEN (
        SELECT COUNT(*) FROM companies 
        WHERE user_id = p_user_id 
          AND created_at BETWEEN v_goal.period_start AND v_goal.period_end + 1
      )
      ELSE v_goal.current_value
    END;
    
    IF v_value != v_goal.current_value THEN
      PERFORM update_goal_progress(v_goal.id, v_value);
      v_updated := v_updated + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object('user_id', p_user_id, 'goals_updated', v_updated);
END;
$function$
