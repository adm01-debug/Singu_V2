CREATE OR REPLACE FUNCTION public.get_pending_cadence_actions(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(enrollment_id uuid, company_name text, cadence_name text, current_step integer, action_type text, action_template uuid, scheduled_for timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    ce.id as enrollment_id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text as company_name,
    sc.name::text as cadence_name,
    ce.current_step,
    (sc.steps->(ce.current_step-1)->>'action_type')::text as action_type,
    ((sc.steps->(ce.current_step-1)->>'template_id')::uuid) as action_template,
    ce.next_action_at as scheduled_for
  FROM cadence_enrollments ce
  JOIN sales_cadences sc ON sc.id = ce.cadence_id
  JOIN companies c ON c.id = ce.company_id
  WHERE ce.status = 'active'
    AND ce.next_action_at <= NOW()
    AND (p_user_id IS NULL OR ce.user_id = p_user_id)
  ORDER BY ce.next_action_at;
END;
$function$
