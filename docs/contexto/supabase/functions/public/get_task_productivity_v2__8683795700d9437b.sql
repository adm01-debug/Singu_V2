CREATE OR REPLACE FUNCTION public.get_task_productivity_v2(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'total_completed', (
      SELECT COUNT(*) FROM tasks 
      WHERE owner_id = p_user_id 
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE - p_days
    ),
    'on_time_rate', (
      SELECT ROUND(
        CASE WHEN COUNT(*) > 0 
          THEN (COUNT(*) FILTER (WHERE completed_at::date <= due_date)::numeric / COUNT(*) * 100)
          ELSE 100
        END, 1
      )
      FROM tasks
      WHERE owner_id = p_user_id
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE - p_days
        AND due_date IS NOT NULL
    ),
    'avg_completion_time_hours', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600)::numeric, 1)
      FROM tasks
      WHERE owner_id = p_user_id
        AND status = 'completed'
        AND completed_at >= CURRENT_DATE - p_days
    )
  );
END;
$function$
