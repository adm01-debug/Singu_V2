CREATE OR REPLACE FUNCTION public.complete_task(p_task_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_task_access(p_task_id);
  UPDATE tasks SET status = 'completed', completed_at = NOW(), updated_at = NOW()
  WHERE id = p_task_id AND status != 'completed';
  RETURN FOUND;
END;
$function$
