CREATE OR REPLACE FUNCTION public.search_contacts(search_term text, max_results integer)
 RETURNS TABLE(id uuid, full_name text, first_name text, last_name text, company_id uuid)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT c.id, c.full_name, c.first_name, c.last_name, c.company_id
  FROM public.contacts AS c
  WHERE (SELECT auth.uid()) IS NOT NULL
    AND c.deleted_at IS NULL
    AND NULLIF(btrim(search_term), '') IS NOT NULL
    AND (
      (c.search_vector IS NOT NULL
       AND c.search_vector @@ websearch_to_tsquery('portuguese', btrim(search_term)))
      OR c.full_name ILIKE '%' || btrim(search_term) || '%'
      OR c.email ILIKE '%' || btrim(search_term) || '%'
      OR c.phone ILIKE '%' || btrim(search_term) || '%'
      OR c.whatsapp ILIKE '%' || btrim(search_term) || '%'
    )
  ORDER BY ts_rank(c.search_vector, websearch_to_tsquery('portuguese', btrim(search_term))) DESC NULLS LAST,
           c.full_name
  LIMIT GREATEST(1, LEAST(COALESCE(max_results, 25), 100))
$function$
