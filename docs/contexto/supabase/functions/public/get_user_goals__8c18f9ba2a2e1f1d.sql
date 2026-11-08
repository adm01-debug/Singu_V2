CREATE OR REPLACE FUNCTION public.get_user_goals(p_user_id uuid DEFAULT NULL::uuid, p_period_type text DEFAULT 'monthly'::text)
 RETURNS TABLE(id uuid, user_id uuid, goal_type text, target_value integer, current_value integer, progress_pct numeric, period_start date, period_end date, days_remaining integer, status text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    sg.id,
    sg.user_id,
    sg.goal_type,
    sg.target_value,
    COALESCE(sg.current_value, 0) as current_value,
    CASE 
      WHEN sg.target_value > 0 
      THEN ROUND((COALESCE(sg.current_value, 0)::numeric / sg.target_value) * 100, 1)
      ELSE 0
    END as progress_pct,
    sg.period_start,
    sg.period_end,
    GREATEST(0, (sg.period_end - CURRENT_DATE)::integer) as days_remaining,
    CASE 
      WHEN COALESCE(sg.current_value, 0) >= sg.target_value THEN 'achieved'
      WHEN sg.period_end < CURRENT_DATE THEN 'expired'
      WHEN COALESCE(sg.current_value, 0)::numeric / NULLIF(sg.target_value, 0) >= 0.8 THEN 'on_track'
      ELSE 'behind'
    END as status
  FROM sales_goals sg
  WHERE (p_user_id IS NULL OR sg.user_id = p_user_id)
    AND CURRENT_DATE BETWEEN sg.period_start AND sg.period_end + 30
  ORDER BY sg.period_end DESC, sg.goal_type;
END;
$function$
