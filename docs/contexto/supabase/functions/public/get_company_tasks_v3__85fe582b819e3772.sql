CREATE OR REPLACE FUNCTION public.get_company_tasks_v3(p_company_id uuid, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, title text, task_type text, priority text, status text, due_date date, owner_name text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    COALESCE(t.title, t.titulo),
    COALESCE(t.task_type, t.tipo),
    COALESCE(t.priority, t.prioridade::text),
    t.status,
    t.due_date,
    p.full_name,
    t.created_at
  FROM tasks t
  LEFT JOIN profiles p ON p.id = t.owner_id
  WHERE t.company_id = p_company_id
    AND (p_status IS NULL OR t.status = p_status)
  ORDER BY t.due_date NULLS LAST, t.created_at DESC
  LIMIT p_limit;
END;
$function$
