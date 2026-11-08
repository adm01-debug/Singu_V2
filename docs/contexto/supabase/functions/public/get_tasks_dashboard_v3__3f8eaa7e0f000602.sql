CREATE OR REPLACE FUNCTION public.get_tasks_dashboard_v3(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'pending_count', (SELECT COUNT(*) FROM tasks WHERE owner_id = p_user_id AND status = 'pending'),
    'overdue_count', (SELECT COUNT(*) FROM tasks WHERE owner_id = p_user_id AND status = 'overdue'),
    'completed_today', (SELECT COUNT(*) FROM tasks WHERE owner_id = p_user_id AND status = 'completed' AND completed_at::date = CURRENT_DATE),
    'due_today', (SELECT COUNT(*) FROM tasks WHERE owner_id = p_user_id AND status = 'pending' AND due_date = CURRENT_DATE),
    'due_this_week', (SELECT COUNT(*) FROM tasks WHERE owner_id = p_user_id AND status = 'pending' AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7),
    'by_type', (
      SELECT COALESCE(jsonb_agg(t), '[]')
      FROM (
        SELECT COALESCE(task_type, tipo) as task_type, COUNT(*) as count
        FROM tasks
        WHERE owner_id = p_user_id AND status IN ('pending', 'overdue')
        GROUP BY COALESCE(task_type, tipo)
      ) t
    ),
    'urgent_tasks', (
      SELECT COALESCE(jsonb_agg(u), '[]')
      FROM (
        SELECT id, COALESCE(title, titulo) as title, due_date
        FROM tasks
        WHERE owner_id = p_user_id 
          AND (priority = 'urgent' OR status = 'overdue')
          AND status NOT IN ('completed', 'cancelled')
        ORDER BY due_date NULLS LAST
        LIMIT 5
      ) u
    )
  );
END;
$function$
