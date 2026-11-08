CREATE OR REPLACE FUNCTION public.get_user_tasks_v3(p_user_id uuid, p_status text DEFAULT NULL::text, p_include_overdue boolean DEFAULT true, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, title text, task_type text, priority text, status text, due_date date, company_id uuid, company_name text, is_overdue boolean, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Atualizar tarefas atrasadas
  UPDATE tasks 
  SET status = 'overdue'
  WHERE owner_id = p_user_id
    AND status = 'pending'
    AND due_date < CURRENT_DATE;
  
  RETURN QUERY
  SELECT 
    t.id,
    COALESCE(t.title, t.titulo) as title,
    COALESCE(t.task_type, t.tipo) as task_type,
    COALESCE(t.priority, t.prioridade::text) as priority,
    t.status,
    t.due_date,
    t.company_id,
    c.nome_crm,
    (t.due_date < CURRENT_DATE AND t.status IN ('pending', 'overdue'))::boolean,
    t.created_at
  FROM tasks t
  LEFT JOIN companies c ON c.id = t.company_id
  WHERE t.owner_id = p_user_id
    AND (p_status IS NULL OR t.status = p_status)
    AND (p_include_overdue OR t.status != 'overdue')
  ORDER BY t.due_date NULLS LAST
  LIMIT p_limit;
END;
$function$
