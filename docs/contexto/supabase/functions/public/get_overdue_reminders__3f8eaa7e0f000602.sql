CREATE OR REPLACE FUNCTION public.get_overdue_reminders(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(reminder_id uuid, title text, reminder_date timestamp with time zone, days_overdue integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, title, reminder_date, EXTRACT(DAY FROM NOW() - reminder_date)::int
  FROM reminders WHERE is_completed = false AND reminder_date < NOW() AND (p_user_id IS NULL OR user_id = p_user_id)
  ORDER BY reminder_date;
$function$
