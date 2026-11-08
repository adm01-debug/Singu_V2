CREATE OR REPLACE FUNCTION public.search_contacts_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS norm_q)
  SELECT c.id, c.first_name, c.last_name, c.email, c.phone
  FROM public.contacts c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(coalesce(c.first_name,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.last_name,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(c.email,''))) % q.norm_q
    )
  ORDER BY GREATEST(
      public.similarity(public.immutable_unaccent(lower(coalesce(c.first_name,''))), q.norm_q),
      public.similarity(public.immutable_unaccent(lower(coalesce(c.last_name,''))), q.norm_q)
    ) DESC NULLS LAST
  LIMIT p_limit;
$function$
