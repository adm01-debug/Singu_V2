CREATE OR REPLACE FUNCTION public.log_activity(p_user_id uuid, p_type text, p_title text, p_description text DEFAULT NULL::text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO activities (user_id, type, title, description, entity_type, entity_id, metadata)
    VALUES (p_user_id, p_type, p_title, p_description, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$function$
