CREATE OR REPLACE FUNCTION public.log_activity(p_user_id uuid, p_activity_type text, p_entity_type text, p_entity_id uuid, p_entity_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO activity_feed (user_id, activity_type, entity_type, entity_id, entity_name, description, metadata)
  VALUES (p_user_id, p_activity_type, p_entity_type, p_entity_id, p_entity_name, p_description, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
