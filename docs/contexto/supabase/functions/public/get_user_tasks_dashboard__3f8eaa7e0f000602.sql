CREATE OR REPLACE FUNCTION public.get_user_tasks_dashboard(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'overdue', (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND status != 'done' AND due_date < CURRENT_DATE),
    'due_today', (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND status != 'done' AND due_date = CURRENT_DATE),
    'due_this_week', (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND status != 'done' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7),
    'in_progress', (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND status = 'in_progress'),
    'completed_today', (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND status = 'done' AND completed_at::date = CURRENT_DATE),
    'completed_this_week', (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND status = 'done' AND completed_at >= CURRENT_DATE - 7),
    'productivity_score', ROUND(
      (SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND status = 'done' AND completed_at >= CURRENT_DATE - 30)::numeric /
      NULLIF((SELECT COUNT(*) FROM tasks WHERE assignee_id = p_user_id AND created_at >= CURRENT_DATE - 30), 0) * 100, 0
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
