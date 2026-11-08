CREATE OR REPLACE FUNCTION public.get_pending_automations(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(task_id uuid, company_id uuid, company_name text, task_type text, scheduled_for timestamp with time zone, hours_until numeric, is_overdue boolean, payload jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    i.id,
    i.company_id,
    c.nome_fantasia::TEXT,
    i.metadata->>'task_type',
    i.data_agendada,
    ROUND(EXTRACT(EPOCH FROM (i.data_agendada - NOW())) / 3600, 1),
    i.data_agendada < NOW(),
    i.metadata->'payload'
  FROM interactions i
  LEFT JOIN companies c ON c.id = i.company_id
  WHERE i.type = 'scheduled_task'
    AND i.status IN ('agendado', 'pendente')
    AND (p_user_id IS NULL OR i.user_id = p_user_id)
  ORDER BY i.data_agendada ASC
  LIMIT p_limit;
END;
$function$
