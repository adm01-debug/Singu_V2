CREATE OR REPLACE FUNCTION public.complete_task(p_task_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_task_access(p_task_id);
  UPDATE tasks SET
    status = 'completed',
    completed_at = NOW(),
    description = COALESCE(p_notes, description),
    updated_at = NOW()
  WHERE id = p_task_id;

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id, 'completed_at', NOW());
END;
$function$
