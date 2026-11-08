CREATE OR REPLACE FUNCTION public.get_cadence_tasks_today(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(cc_id uuid, company_id uuid, company_name text, cadence_name text, step integer, action jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT cc.id, cc.company_id, COALESCE(c.nome_fantasia, c.nome_crm), sc.name, cc.current_step, sc.steps->(cc.current_step - 1)
  FROM company_cadences cc JOIN companies c ON c.id = cc.company_id JOIN sales_cadences sc ON sc.id = cc.cadence_id
  WHERE cc.status = 'active' AND cc.next_action_date <= CURRENT_DATE AND (p_user_id IS NULL OR cc.user_id = p_user_id);
$function$
