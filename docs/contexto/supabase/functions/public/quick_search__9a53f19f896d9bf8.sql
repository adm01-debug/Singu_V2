CREATE OR REPLACE FUNCTION public.quick_search(p_query text)
 RETURNS TABLE(entity_type text, entity_id uuid, name text, extra_info text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT 'company'::text, c.id, COALESCE(c.nome_fantasia, c.nome_crm), c.cnpj FROM companies c WHERE c.deleted_at IS NULL AND c.nome_fantasia ILIKE '%' || p_query || '%' LIMIT 5;
  RETURN QUERY SELECT 'contact'::text, ct.id, COALESCE(ct.full_name, ct.first_name), ct.cargo FROM contacts ct WHERE ct.deleted_at IS NULL AND ct.full_name ILIKE '%' || p_query || '%' LIMIT 5;
  RETURN QUERY SELECT 'deal'::text, d.id, d.titulo, d.valor::text FROM deals d WHERE d.titulo ILIKE '%' || p_query || '%' LIMIT 5;
END;
$function$
