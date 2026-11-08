CREATE OR REPLACE FUNCTION public.search_products_semantic(p_user_id uuid, p_query text, p_limit integer DEFAULT 20, p_min_similarity real DEFAULT 0.1)
 RETURNS TABLE(id uuid, external_id text, name text, description text, category text, tags text[], image_url text, price numeric, metadata jsonb, similarity real)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT
    p.id, p.external_id, p.name, p.description, p.category,
    p.tags, p.image_url, p.price, p.metadata,
    GREATEST(
      public.similarity(public.immutable_unaccent(lower(p.name)), public.immutable_unaccent(lower(p_query))),
      public.similarity(public.immutable_unaccent(lower(COALESCE(p.description, ''))), public.immutable_unaccent(lower(p_query))) * 0.7,
      public.similarity(public.immutable_unaccent(lower(COALESCE(p.category, ''))), public.immutable_unaccent(lower(p_query))) * 0.5
    )::real AS similarity
  FROM public.search_products_cache p
  WHERE p.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(p.name)) % public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.description, ''))) % public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.category, ''))) % public.immutable_unaccent(lower(p_query))
      OR EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.tags, ARRAY[]::text[])) t
        WHERE public.immutable_unaccent(lower(t)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      )
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$function$
