CREATE OR REPLACE FUNCTION public.quick_search(p_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(entity_type text, id uuid, name text, detail text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  -- Empresas
  SELECT 'company'::text, c.id, COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as name, 
         c.cnpj as detail
  FROM companies c
  WHERE (COALESCE(c.nome_fantasia, c.nome_crm) ILIKE '%' || p_query || '%'
     OR c.razao_social ILIKE '%' || p_query || '%'
     OR c.cnpj ILIKE '%' || p_query || '%')
    AND c.deleted_at IS NULL
  UNION ALL
  -- Contatos
  SELECT 'contact'::text, ct.id, COALESCE(ct.full_name, ct.first_name) as name,
         ct.cargo as detail
  FROM contacts ct
  WHERE (ct.full_name ILIKE '%' || p_query || '%'
     OR ct.first_name ILIKE '%' || p_query || '%')
    AND ct.deleted_at IS NULL
  LIMIT p_limit;
END;
$function$
