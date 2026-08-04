
-- Search contacts with accent-insensitive matching
CREATE OR REPLACE FUNCTION public.search_contacts_unaccent(
  p_user_id uuid,
  p_query text,
  p_limit int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  role_title text,
  company_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Search companies with accent-insensitive matching
CREATE OR REPLACE FUNCTION public.search_companies_unaccent(
  p_user_id uuid,
  p_query text,
  p_limit int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  name text,
  industry text,
  city text,
  state text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.industry, c.city, c.state
  FROM public.companies c
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.industry, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.city, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  LIMIT p_limit;
$$;

-- Search interactions with accent-insensitive matching
CREATE OR REPLACE FUNCTION public.search_interactions_unaccent(
  p_user_id uuid,
  p_query text,
  p_limit int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  title text,
  type text,
  created_at timestamptz,
  contact_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.title, i.type, i.created_at, i.contact_id
  FROM public.interactions i
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(i.title)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(i.content, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  ORDER BY i.created_at DESC
  LIMIT p_limit;
$$;
