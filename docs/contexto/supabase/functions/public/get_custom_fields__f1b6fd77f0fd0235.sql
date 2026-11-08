CREATE OR REPLACE FUNCTION public.get_custom_fields(p_entity_type text)
 RETURNS TABLE(field_id uuid, field_name text, field_label text, field_type text, options jsonb, is_required boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, field_name, field_label, field_type, options, is_required
  FROM custom_fields
  WHERE entity_type = p_entity_type AND is_active = true
  ORDER BY display_order NULLS LAST;
$function$
