CREATE OR REPLACE FUNCTION public.search_interactions_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, title text, content text, type text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS norm_q)
  SELECT i.id, i.title, i.content, i.type, i.created_at
  FROM public.interactions i, q
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(coalesce(i.title,''))) % q.norm_q
      OR public.immutable_unaccent(lower(coalesce(i.content,''))) % q.norm_q
    )
  ORDER BY 
    public.similarity(public.immutable_unaccent(lower(coalesce(i.title,''))), q.norm_q) DESC NULLS LAST,
    i.created_at DESC
  LIMIT p_limit;
$function$
