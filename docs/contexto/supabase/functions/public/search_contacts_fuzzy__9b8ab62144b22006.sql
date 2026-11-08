CREATE OR REPLACE FUNCTION public.search_contacts_fuzzy(search_term text, limit_results integer DEFAULT 20)
 RETURNS TABLE(id uuid, full_name text, company_id uuid, similarity_score real)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id, c.full_name, c.company_id,
         GREATEST(
           similarity(COALESCE(c.full_name, ''), search_term),
           similarity(COALESCE(c.first_name, ''), search_term),
           similarity(COALESCE(c.last_name, ''), search_term),
           similarity(COALESCE(c.apelido, '')::text, search_term)
         ) as similarity_score
  FROM contacts c
  WHERE c.deleted_at IS NULL
  AND (
    c.full_name % search_term OR
    c.first_name % search_term OR
    c.last_name % search_term OR
    c.apelido::text % search_term
  )
  ORDER BY similarity_score DESC
  LIMIT limit_results;
END;
$function$
