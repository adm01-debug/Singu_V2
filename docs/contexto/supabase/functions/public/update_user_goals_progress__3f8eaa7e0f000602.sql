CREATE OR REPLACE FUNCTION public.update_user_goals_progress(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_goal RECORD;
  v_current numeric;
  v_updated int := 0;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  FOR v_goal IN 
    SELECT * FROM user_goals 
    WHERE user_id = p_user_id 
      AND CURRENT_DATE BETWEEN period_start AND period_end
      AND is_achieved = false
  LOOP
    v_current := CASE v_goal.goal_type
      WHEN 'deals_count' THEN (SELECT COUNT(*) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at::date BETWEEN v_goal.period_start AND v_goal.period_end)
      WHEN 'deals_value' THEN (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE user_id = p_user_id AND status = 'ganho' AND closed_at::date BETWEEN v_goal.period_start AND v_goal.period_end)
      WHEN 'interactions' THEN (SELECT COUNT(*) FROM interactions WHERE user_id = p_user_id AND data_interacao::date BETWEEN v_goal.period_start AND v_goal.period_end)
      WHEN 'new_companies' THEN (SELECT COUNT(*) FROM companies WHERE user_id = p_user_id AND created_at::date BETWEEN v_goal.period_start AND v_goal.period_end)
      WHEN 'proposals' THEN (SELECT COUNT(*) FROM proposals WHERE user_id = p_user_id AND status = 'aceita' AND data_resposta::date BETWEEN v_goal.period_start AND v_goal.period_end)
      ELSE 0
    END;
    
    UPDATE user_goals SET 
      current_value = v_current,
      is_achieved = (v_current >= target_value),
      achieved_at = CASE WHEN v_current >= target_value AND NOT is_achieved THEN NOW() ELSE achieved_at END,
      updated_at = NOW()
    WHERE id = v_goal.id;
    
    v_updated := v_updated + 1;
  END LOOP;
  
  RETURN v_updated;
END;
$function$
