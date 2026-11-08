CREATE OR REPLACE FUNCTION public.update_goal_progress(p_goal_id uuid, p_new_value numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_goal user_goals%ROWTYPE;
  v_achieved boolean;
BEGIN
  PERFORM public.assert_goal_access(p_goal_id);
  SELECT * INTO v_goal FROM user_goals WHERE id = p_goal_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Meta não encontrada'); END IF;
  
  v_achieved := p_new_value >= v_goal.target_value;
  
  UPDATE user_goals SET 
    current_value = p_new_value,
    is_achieved = v_achieved,
    achieved_at = CASE WHEN v_achieved AND NOT v_goal.is_achieved THEN NOW() ELSE achieved_at END,
    updated_at = NOW()
  WHERE id = p_goal_id;
  
  RETURN jsonb_build_object('goal_id', p_goal_id, 'new_value', p_new_value, 'achieved', v_achieved);
END;
$function$
