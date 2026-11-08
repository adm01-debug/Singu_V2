CREATE OR REPLACE FUNCTION public.log_automation_execution(p_task_id uuid, p_status text, p_result jsonb DEFAULT NULL::jsonb, p_error_message text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'log_automation_execution is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  UPDATE interactions
  SET 
    status = CASE p_status 
      WHEN 'success' THEN 'concluido'
      WHEN 'failed' THEN 'erro'
      WHEN 'skipped' THEN 'cancelado'
      ELSE p_status
    END,
    metadata = metadata || jsonb_build_object(
      'execution_result', p_result,
      'execution_status', p_status,
      'error_message', p_error_message,
      'executed_at', NOW()
    ),
    updated_at = NOW()
  WHERE id = p_task_id AND type = 'scheduled_task';
  
  RETURN FOUND;
END;
$function$
