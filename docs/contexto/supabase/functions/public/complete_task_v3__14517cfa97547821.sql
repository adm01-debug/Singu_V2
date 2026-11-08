CREATE OR REPLACE FUNCTION public.complete_task_v3(p_task_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_task_access(p_task_id);
  UPDATE tasks
  SET status = 'completed',
      completed_at = now()
  WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tarefa não encontrada');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'completed_at', now()
  );
END;
$function$
