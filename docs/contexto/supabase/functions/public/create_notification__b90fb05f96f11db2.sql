CREATE OR REPLACE FUNCTION public.create_notification(p_user_id uuid, p_type text, p_title text, p_message text DEFAULT NULL::text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_action_url text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, action_url)
  VALUES (p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id, p_action_url)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
