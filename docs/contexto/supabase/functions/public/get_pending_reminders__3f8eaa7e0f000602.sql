CREATE OR REPLACE FUNCTION public.get_pending_reminders(p_user_id uuid)
 RETURNS TABLE(reminder_id uuid, title text, reminder_date timestamp with time zone, company_name text, is_overdue boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT r.id, r.title, r.reminder_date,
    (SELECT COALESCE(c.nome_fantasia, c.nome_crm) FROM companies c WHERE c.id = r.company_id),
    r.reminder_date < NOW()
  FROM reminders r WHERE r.user_id = p_user_id AND r.is_completed = false ORDER BY r.reminder_date;
$function$
