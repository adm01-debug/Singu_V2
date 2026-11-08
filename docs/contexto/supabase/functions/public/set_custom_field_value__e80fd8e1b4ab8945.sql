CREATE OR REPLACE FUNCTION public.set_custom_field_value(p_entity_type text, p_entity_id uuid, p_field_name text, p_value text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  EXECUTE format('UPDATE %I SET metadata = COALESCE(metadata, ''{}''::jsonb) || jsonb_build_object(%L, %L) WHERE id = %L',
    p_entity_type || 's', p_field_name, p_value, p_entity_id);
  RETURN true;
EXCEPTION WHEN OTHERS THEN RETURN false;
END;
$function$
