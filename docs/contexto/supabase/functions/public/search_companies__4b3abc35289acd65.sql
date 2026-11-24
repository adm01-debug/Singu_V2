CREATE OR REPLACE FUNCTION public.search_companies(search_term text, max_results integer)
 RETURNS TABLE(id uuid, nome_fantasia text, razao_social text, cnpj text, status text, is_customer boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT c.id, c.nome_fantasia, c.razao_social, c.cnpj, c.status::text, c.is_customer
  FROM public.companies AS c
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND c.deleted_at IS NULL
    AND NULLIF(btrim(search_term), '') IS NOT NULL
    AND (
      (c.search_vector IS NOT NULL
       AND c.search_vector @@ websearch_to_tsquery('portuguese', btrim(search_term)))
      OR c.nome_crm ILIKE '%' || btrim(search_term) || '%'
      OR c.nome_fantasia ILIKE '%' || btrim(search_term) || '%'
      OR c.razao_social ILIKE '%' || btrim(search_term) || '%'
      OR c.cnpj ILIKE '%' || btrim(search_term) || '%'
    )
  ORDER BY ts_rank(c.search_vector, websearch_to_tsquery('portuguese', btrim(search_term))) DESC NULLS LAST,
           c.nome_crm
  LIMIT GREATEST(1, LEAST(COALESCE(max_results, 25), 100))
$function$
