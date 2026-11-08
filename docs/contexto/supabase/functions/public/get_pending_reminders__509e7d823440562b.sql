CREATE OR REPLACE FUNCTION public.get_pending_reminders(p_user_id uuid DEFAULT auth.uid(), p_include_future boolean DEFAULT true, p_days_ahead integer DEFAULT 7)
 RETURNS TABLE(id uuid, company_id uuid, company_name text, title text, reminder_date timestamp with time zone, reminder_type text, priority text, notes text, is_overdue boolean, minutes_until integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    r.id,
    r.company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as company_name,
    r.title,
    r.reminder_date,
    r.reminder_type,
    r.priority,
    r.notes,
    r.reminder_date < NOW() as is_overdue,
    EXTRACT(EPOCH FROM r.reminder_date - NOW())::int / 60 as minutes_until
  FROM reminders r
  JOIN companies c ON c.id = r.company_id
  WHERE r.user_id = p_user_id
    AND r.is_completed = false
    AND (r.snoozed_until IS NULL OR r.snoozed_until <= NOW())
    AND (p_include_future OR r.reminder_date <= NOW())
    AND r.reminder_date <= NOW() + (p_days_ahead || ' days')::interval
  ORDER BY 
    CASE r.priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      ELSE 4 
    END,
    r.reminder_date;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
