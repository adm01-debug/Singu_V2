CREATE OR REPLACE FUNCTION public.create_custom_field(p_entity_type text, p_field_name text, p_field_label text, p_field_type text, p_options jsonb DEFAULT NULL::jsonb, p_is_required boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO custom_fields (entity_type, field_name, field_label, field_type, options, is_required)
  VALUES (p_entity_type, p_field_name, p_field_label, p_field_type, p_options, p_is_required)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
