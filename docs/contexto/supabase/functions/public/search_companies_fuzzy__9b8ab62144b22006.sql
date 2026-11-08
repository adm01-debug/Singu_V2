CREATE OR REPLACE FUNCTION public.search_companies_fuzzy(search_term text, limit_results integer DEFAULT 20)
 RETURNS TABLE(id uuid, nome_crm text, razao_social text, cnpj text, similarity_score real)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome_crm, c.razao_social, c.cnpj,
         GREATEST(
           similarity(COALESCE(c.nome_crm, ''), search_term),
           similarity(COALESCE(c.razao_social, ''), search_term),
           similarity(COALESCE(c.nome_fantasia, ''), search_term)
         ) as similarity_score
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND (
    c.nome_crm % search_term OR
    c.razao_social % search_term OR
    c.nome_fantasia % search_term
  )
  ORDER BY similarity_score DESC
  LIMIT limit_results;
END;
$function$
