CREATE OR REPLACE FUNCTION public.autocomplete_companies(p_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, nome_crm text, cnpj text, cidade text, uf text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome_crm, c.cnpj, ca.cidade::text, ca.estado::text AS uf
  FROM companies c
  LEFT JOIN company_addresses ca ON ca.company_id = c.id AND ca.is_primary
  WHERE c.deleted_at IS NULL
  AND (c.nome_crm ILIKE p_query || '%' OR c.nome_crm ILIKE '%' || p_query || '%')
  ORDER BY
    CASE WHEN c.nome_crm ILIKE p_query || '%' THEN 0 ELSE 1 END,
    c.nome_crm
  LIMIT p_limit;
END;
$function$
