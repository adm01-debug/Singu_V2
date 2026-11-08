CREATE OR REPLACE FUNCTION public.snooze_reminder(p_reminder_id uuid, p_hours integer DEFAULT 1)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_new timestamptz;
BEGIN
  PERFORM public.assert_reminder_access(p_reminder_id);
  UPDATE reminders SET reminder_date = reminder_date + (p_hours || ' hours')::interval WHERE id = p_reminder_id RETURNING reminder_date INTO v_new;
  RETURN v_new;
END;
$function$
