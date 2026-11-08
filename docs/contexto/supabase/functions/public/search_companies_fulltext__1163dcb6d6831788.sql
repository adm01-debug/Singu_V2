CREATE OR REPLACE FUNCTION public.search_companies_fulltext(p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, nome_crm text, razao_social text, cnpj text, status company_status, rank real)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_text tsquery;
BEGIN
  -- Converter query para tsquery
  tsquery_text := plainto_tsquery('portuguese', p_query);
  
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    c.razao_social,
    c.cnpj,
    c.status,
    ts_rank(c.search_vector, tsquery_text) as rank
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND c.search_vector @@ tsquery_text
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$function$
