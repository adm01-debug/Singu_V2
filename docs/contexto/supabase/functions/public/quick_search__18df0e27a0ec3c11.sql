CREATE OR REPLACE FUNCTION public.quick_search(p_entity_type text, p_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, display_name text, secondary_info text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_entity_type = 'company' THEN
    RETURN QUERY
    SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm)::text as display_name, c.cnpj::text as secondary_info
    FROM companies c WHERE c.deleted_at IS NULL AND (c.nome_fantasia ILIKE '%' || p_query || '%' OR c.nome_crm ILIKE '%' || p_query || '%' OR c.cnpj ILIKE '%' || p_query || '%')
    LIMIT p_limit;
  ELSIF p_entity_type = 'contact' THEN
    RETURN QUERY
    SELECT ct.id, COALESCE(ct.full_name, ct.first_name)::text as display_name, ct.cargo::text as secondary_info
    FROM contacts ct WHERE ct.deleted_at IS NULL AND (ct.full_name ILIKE '%' || p_query || '%' OR ct.first_name ILIKE '%' || p_query || '%')
    LIMIT p_limit;
  ELSIF p_entity_type = 'deal' THEN
    RETURN QUERY
    SELECT d.id, d.titulo::text as display_name, d.status::text as secondary_info
    FROM deals d WHERE d.titulo ILIKE '%' || p_query || '%'
    LIMIT p_limit;
  END IF;
END;
$function$
