CREATE OR REPLACE FUNCTION public.schedule_automated_task(p_company_id uuid, p_task_type text, p_scheduled_for timestamp with time zone, p_payload jsonb DEFAULT NULL::jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_task_id UUID;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO interactions (
    id, company_id, type, channel, direction,
    title, status, data_agendada, metadata, user_id, created_at
  ) VALUES (
    gen_random_uuid(),
    p_company_id,
    'scheduled_task',
    'sistema',
    'internal',
    'Tarefa: ' || p_task_type,
    'agendado',
    p_scheduled_for,
    jsonb_build_object(
      'task_type', p_task_type,
      'payload', p_payload,
      'scheduled_by', p_user_id
    ),
    p_user_id,
    NOW()
  )
  RETURNING id INTO v_task_id;
  
  RETURN v_task_id;
END;
$function$
