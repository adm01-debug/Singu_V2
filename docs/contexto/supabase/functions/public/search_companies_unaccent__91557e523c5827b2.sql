CREATE OR REPLACE FUNCTION public.search_companies_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, name text, industry text, city text, state text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS norm_q)
  SELECT c.id, c.name, c.industry, c.city, c.state
  FROM public.companies c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.industry,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.city,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.nome_crm,''))) % q.norm_q
    )
  ORDER BY public.similarity(public.immutable_unaccent(lower(c.name)), q.norm_q) DESC NULLS LAST
  LIMIT p_limit;
$function$
