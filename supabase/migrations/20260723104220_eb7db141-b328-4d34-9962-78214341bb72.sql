CREATE OR REPLACE FUNCTION public.search_companies_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, name text, industry text, city text, state text)
 LANGUAGE sql STABLE SECURITY INVOKER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT c.id, c.name, c.industry, c.city, c.state
  FROM public.companies c
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.industry, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.city, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_contacts_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, role_title text, company_id uuid)
 LANGUAGE sql STABLE SECURITY INVOKER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.role_title, c.company_id
  FROM public.contacts c
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.first_name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(c.last_name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.email, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.role_title, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_interactions_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, title text, type text, created_at timestamp with time zone, contact_id uuid)
 LANGUAGE sql STABLE SECURITY INVOKER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT i.id, i.title, i.type, i.created_at, i.contact_id
  FROM public.interactions i
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(i.title)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(i.content, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  ORDER BY i.created_at DESC
  LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION public.search_products_semantic(p_user_id uuid, p_query text, p_limit integer DEFAULT 20, p_min_similarity real DEFAULT 0.1)
 RETURNS TABLE(id uuid, external_id text, name text, description text, category text, tags text[], image_url text, price numeric, metadata jsonb, similarity real)
 LANGUAGE sql STABLE SECURITY INVOKER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  SELECT
    p.id, p.external_id, p.name, p.description, p.category, p.tags, p.image_url, p.price, p.metadata,
    GREATEST(
      extensions.similarity(public.immutable_unaccent(lower(p.name)), public.immutable_unaccent(lower(p_query))),
      extensions.similarity(public.immutable_unaccent(lower(COALESCE(p.description, ''))), public.immutable_unaccent(lower(p_query))) * 0.7,
      extensions.similarity(public.immutable_unaccent(lower(COALESCE(p.category, ''))), public.immutable_unaccent(lower(p_query))) * 0.5
    )::real AS similarity
  FROM public.search_products_cache p
  WHERE p.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(p.name)) OPERATOR(extensions.%) public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.description, ''))) OPERATOR(extensions.%) public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.category, ''))) OPERATOR(extensions.%) public.immutable_unaccent(lower(p_query))
      OR EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.tags, ARRAY[]::text[])) t
        WHERE public.immutable_unaccent(lower(t)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      )
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$function$;