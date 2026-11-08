CREATE OR REPLACE FUNCTION public.trigger_workflow_event(p_event_type text, p_entity_type text, p_entity_id uuid, p_payload jsonb DEFAULT NULL::jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_event_id UUID;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Registrar o evento no log
  INSERT INTO interactions (
    id, company_id, type, channel, direction,
    title, content, metadata, source_system, user_id, created_at
  ) VALUES (
    gen_random_uuid(),
    CASE WHEN p_entity_type = 'company' THEN p_entity_id ELSE NULL END,
    'workflow_event',
    'sistema',
    'internal',
    'Evento: ' || p_event_type,
    'Workflow triggered for ' || p_entity_type || ': ' || p_entity_id::TEXT,
    jsonb_build_object(
      'event_type', p_event_type,
      'entity_type', p_entity_type,
      'entity_id', p_entity_id,
      'payload', p_payload,
      'triggered_at', NOW()
    ),
    'workflow_engine',
    p_user_id,
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$function$
