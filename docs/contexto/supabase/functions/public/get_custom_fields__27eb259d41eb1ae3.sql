CREATE OR REPLACE FUNCTION public.get_custom_fields(p_entity_type text, p_entity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(
      cf.field_name,
      COALESCE(cfv.value_text, cfv.value_number::text, cfv.value_date::text, cfv.value_boolean::text, cfv.value_json::text)
    )
    FROM custom_fields cf
    LEFT JOIN custom_field_values cfv ON cfv.custom_field_id = cf.id AND cfv.entity_id = p_entity_id
    WHERE cf.entity_type = p_entity_type AND cf.is_active = true
  );
END;
$function$
