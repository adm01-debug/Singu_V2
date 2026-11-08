CREATE OR REPLACE FUNCTION public.snooze_task(p_task_id uuid, p_task_type text, p_snooze_days integer DEFAULT 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_task_access(p_task_id);
  IF p_task_type = 'follow_up' THEN
    UPDATE interactions SET follow_up_date = follow_up_date + (p_snooze_days || ' days')::interval
    WHERE id = p_task_id;
  ELSIF p_task_type = 'reminder' THEN
    UPDATE reminders SET due_date = due_date + (p_snooze_days || ' days')::interval
    WHERE id = p_task_id;
  END IF;
  
  RETURN FOUND;
END;
$function$
