CREATE OR REPLACE FUNCTION public.get_daily_action_plan(p_user_id uuid)
 RETURNS TABLE(item_type text, item_id uuid, title text, priority text, due_time timestamp with time zone, company_name text, action text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  -- Tarefas vencidas e de hoje
  SELECT 
    'task'::text,
    t.id,
    t.title::text,
    COALESCE(t.priority, 'medium')::text,
    t.due_date::timestamptz,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    'Completar tarefa'::text
  FROM tasks t
  LEFT JOIN companies c ON c.id = t.company_id
  WHERE t.assignee_id = p_user_id
    AND t.status != 'done'
    AND t.due_date <= CURRENT_DATE
  
  UNION ALL
  
  -- Cadências programadas
  SELECT 
    'cadence'::text,
    cc.id,
    ('Cadência: ' || sc.name)::text,
    'high'::text,
    cc.next_action_date::timestamptz,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    'Executar passo'::text
  FROM company_cadences cc
  JOIN sales_cadences sc ON sc.id = cc.cadence_id
  JOIN companies c ON c.id = cc.company_id
  WHERE cc.user_id = p_user_id
    AND cc.status = 'active'
    AND cc.next_action_date <= CURRENT_DATE
  
  ORDER BY due_time ASC NULLS LAST
  LIMIT 20;
END;
$function$
