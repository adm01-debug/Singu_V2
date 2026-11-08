CREATE OR REPLACE FUNCTION public.get_pending_tasks(p_user_id uuid, p_include_overdue boolean DEFAULT true)
 RETURNS TABLE(task_id uuid, title text, company_name text, task_type text, priority text, due_date date, is_overdue boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT
    t.id as task_id,
    t.title::text,
    COALESCE(c.nome_fantasia, c.nome_crm)::text as company_name,
    t.task_type::text,
    t.priority::text,
    t.due_date,
    (t.due_date < CURRENT_DATE) as is_overdue
  FROM tasks t
  LEFT JOIN companies c ON c.id = t.company_id
  WHERE t.user_id = p_user_id
    AND t.status = 'pending'
    AND (p_include_overdue OR t.due_date >= CURRENT_DATE)
  ORDER BY
    CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
    t.due_date NULLS LAST;
END;
$function$
