CREATE OR REPLACE FUNCTION public.global_search(p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(entity_type text, entity_id uuid, title text, subtitle text, relevance integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH results AS (
    SELECT 'company'::text, id, COALESCE(nome_fantasia, nome_crm), cnpj::text, 100
    FROM companies WHERE deleted_at IS NULL AND (nome_fantasia ILIKE '%' || p_query || '%' OR cnpj ILIKE '%' || p_query || '%')
    UNION ALL
    SELECT 'contact', id, COALESCE(full_name, first_name), NULL, 90
    FROM contacts WHERE deleted_at IS NULL AND full_name ILIKE '%' || p_query || '%'
    UNION ALL
    SELECT 'deal', id, titulo, status, 80
    FROM deals WHERE titulo ILIKE '%' || p_query || '%'
  )
  SELECT * FROM results ORDER BY 5 DESC LIMIT p_limit;
$function$
