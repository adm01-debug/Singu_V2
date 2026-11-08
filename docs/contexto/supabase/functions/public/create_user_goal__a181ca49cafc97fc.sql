CREATE OR REPLACE FUNCTION public.create_user_goal(p_user_id uuid, p_goal_type text, p_target_value numeric, p_period_type text DEFAULT 'monthly'::text, p_period_start date DEFAULT NULL::date)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE 
  v_id uuid;
  v_start date := COALESCE(p_period_start, date_trunc('month', CURRENT_DATE)::date);
  v_end date;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  v_end := CASE p_period_type
    WHEN 'daily' THEN v_start
    WHEN 'weekly' THEN v_start + 6
    WHEN 'monthly' THEN (v_start + interval '1 month' - interval '1 day')::date
    WHEN 'quarterly' THEN (v_start + interval '3 months' - interval '1 day')::date
    WHEN 'yearly' THEN (v_start + interval '1 year' - interval '1 day')::date
    ELSE v_start + 29
  END;
  
  INSERT INTO user_goals (user_id, goal_type, target_value, period_type, period_start, period_end)
  VALUES (p_user_id, p_goal_type, p_target_value, p_period_type, v_start, v_end)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
