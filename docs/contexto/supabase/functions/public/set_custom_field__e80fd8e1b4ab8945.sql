CREATE OR REPLACE FUNCTION public.set_custom_field(p_entity_type text, p_entity_id uuid, p_field_name text, p_value text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_field RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_field FROM custom_fields WHERE entity_type = p_entity_type AND field_name = p_field_name AND is_active = true;
  
  IF NOT FOUND THEN RETURN false; END IF;
  
  INSERT INTO custom_field_values (custom_field_id, entity_id, value_text)
  VALUES (v_field.id, p_entity_id, p_value)
  ON CONFLICT (custom_field_id, entity_id) DO UPDATE SET value_text = p_value, updated_at = NOW();
  
  RETURN true;
END;
$function$
