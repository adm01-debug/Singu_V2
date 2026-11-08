CREATE OR REPLACE FUNCTION public.complete_task_batch(p_task_ids uuid[], p_task_type text, p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  IF p_task_type = 'follow_up' THEN
    UPDATE interactions SET followup_concluido = true, updated_at = NOW()
    WHERE id = ANY(p_task_ids) AND (user_id = p_user_id OR p_user_id IS NULL);
  ELSIF p_task_type = 'reminder' THEN
    UPDATE reminders SET status = 'completed', completed_at = NOW()
    WHERE id = ANY(p_task_ids) AND (user_id = p_user_id OR p_user_id IS NULL);
  END IF;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$
