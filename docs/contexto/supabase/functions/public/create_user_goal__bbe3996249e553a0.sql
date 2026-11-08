CREATE OR REPLACE FUNCTION public.create_user_goal(p_user_id uuid, p_goal_type text, p_target_value numeric, p_period_type text DEFAULT 'monthly'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_start date;
  v_end date;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  v_start := CASE p_period_type
    WHEN 'daily' THEN CURRENT_DATE
    WHEN 'weekly' THEN DATE_TRUNC('week', CURRENT_DATE)::date
    WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE)::date
    WHEN 'quarterly' THEN DATE_TRUNC('quarter', CURRENT_DATE)::date
    WHEN 'yearly' THEN DATE_TRUNC('year', CURRENT_DATE)::date
  END;
  
  v_end := CASE p_period_type
    WHEN 'daily' THEN CURRENT_DATE
    WHEN 'weekly' THEN (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::date
    WHEN 'monthly' THEN (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date
    WHEN 'quarterly' THEN (DATE_TRUNC('quarter', CURRENT_DATE) + INTERVAL '3 months - 1 day')::date
    WHEN 'yearly' THEN (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year - 1 day')::date
  END;
  
  INSERT INTO user_goals (user_id, goal_type, target_value, period_type, period_start, period_end)
  VALUES (p_user_id, p_goal_type, p_target_value, p_period_type, v_start, v_end)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$function$
