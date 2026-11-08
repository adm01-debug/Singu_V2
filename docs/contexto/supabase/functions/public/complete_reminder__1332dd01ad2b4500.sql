CREATE OR REPLACE FUNCTION public.complete_reminder(p_reminder_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  PERFORM public.assert_reminder_access(p_reminder_id);
  UPDATE reminders SET is_completed = true, completed_at = NOW()
  WHERE id = p_reminder_id;
  RETURN FOUND;
END;
$function$
