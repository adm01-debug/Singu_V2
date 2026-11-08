CREATE OR REPLACE FUNCTION public.get_custom_field_value(p_entity_type text, p_entity_id uuid, p_field_name text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_value text;
BEGIN
  EXECUTE format('SELECT (metadata->>%L)::text FROM %I WHERE id = %L', 
    p_field_name, p_entity_type || 's', p_entity_id) INTO v_value;
  RETURN v_value;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$function$
