CREATE OR REPLACE FUNCTION public.get_favorites(p_entity_type text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, entity_type text, entity_id uuid, entity_name text, added_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    f.id,
    f.entity_type::text,
    f.entity_id,
    CASE f.entity_type
      WHEN 'company' THEN (SELECT COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) FROM companies c WHERE c.id = f.entity_id)
      WHEN 'contact' THEN (SELECT COALESCE(ct.full_name, ct.first_name) FROM contacts ct WHERE ct.id = f.entity_id)
      ELSE 'N/A'
    END as entity_name,
    f.created_at as added_at
  FROM favorites f
  WHERE f.user_id = p_user_id
    AND (p_entity_type IS NULL OR f.entity_type = p_entity_type)
  ORDER BY f.created_at DESC;
END;
$function$
