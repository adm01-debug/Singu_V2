CREATE OR REPLACE FUNCTION public.get_overdue_tasks(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(task_type text, task_id uuid, company_id uuid, company_name text, due_date date, days_overdue integer, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Follow-ups atrasados
  RETURN QUERY
  SELECT
    'follow_up'::text as task_type,
    i.id as task_id,
    i.company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    COALESCE(i.follow_up_date::date, i.data_followup::date) as due_date,
    (CURRENT_DATE - COALESCE(i.follow_up_date::date, i.data_followup::date))::int as days_overdue,
    CASE WHEN CURRENT_DATE - COALESCE(i.follow_up_date::date, i.data_followup::date) > 7 THEN 'critical' ELSE 'high' END::text as priority
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE COALESCE(i.follow_up_date::date, i.data_followup::date) < CURRENT_DATE
    AND COALESCE(i.followup_concluido, false) = false
    AND (COALESCE(i.follow_up_required, false) OR COALESCE(i.requer_followup, false))
    AND (p_user_id IS NULL OR i.created_by = p_user_id)

  UNION ALL

  -- Lembretes atrasados
  SELECT
    'reminder'::text as task_type,
    r.id as task_id,
    r.company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    r.reminder_date::date,
    (CURRENT_DATE - r.reminder_date::date)::int as days_overdue,
    CASE WHEN CURRENT_DATE - r.reminder_date::date > 7 THEN 'critical' ELSE 'high' END::text as priority
  FROM reminders r
  LEFT JOIN companies c ON c.id = r.company_id
  WHERE r.reminder_date::date < CURRENT_DATE AND COALESCE(r.is_completed, false) = false
    AND (p_user_id IS NULL OR r.user_id = p_user_id)

  ORDER BY days_overdue DESC
  LIMIT p_limit;
END;
$function$
