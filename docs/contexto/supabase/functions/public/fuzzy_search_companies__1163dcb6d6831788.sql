CREATE OR REPLACE FUNCTION public.fuzzy_search_companies(p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, nome_crm text, cnpj text, cidade text, uf text, similarity_score real)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id as company_id,
    c.nome_crm,
    c.cnpj,
    ca.cidade::text,
    ca.estado::text AS uf,
    GREATEST(
      similarity(LOWER(c.nome_crm), LOWER(p_query)),
      similarity(COALESCE(c.cnpj, ''), p_query)
    ) as similarity_score
  FROM companies c
  LEFT JOIN company_addresses ca ON ca.company_id = c.id AND ca.is_primary
  WHERE c.deleted_at IS NULL
  AND (
    c.nome_crm ILIKE '%' || p_query || '%'
    OR c.cnpj LIKE '%' || p_query || '%'
    OR similarity(LOWER(c.nome_crm), LOWER(p_query)) > 0.3
  )
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$function$
