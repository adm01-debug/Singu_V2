-- Habilitar pg_trgm caso ainda não esteja
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Permitir UPDATE no cache (edge function faz upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'semantic_search_cache'
      AND policyname = 'Users update own search cache'
  ) THEN
    CREATE POLICY "Users update own search cache"
      ON public.semantic_search_cache FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Índices trigram
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm
  ON public.contacts USING gin (public.immutable_unaccent(lower(first_name)) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm
  ON public.contacts USING gin (public.immutable_unaccent(lower(last_name)) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_companies_name_trgm
  ON public.companies USING gin (public.immutable_unaccent(lower(name)) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_interactions_title_trgm
  ON public.interactions USING gin (public.immutable_unaccent(lower(title)) extensions.gin_trgm_ops);

-- ── search_contacts_semantic ──────────────────────
CREATE OR REPLACE FUNCTION public.search_contacts_semantic(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_min_similarity REAL DEFAULT 0.15
)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role_title TEXT,
  company_id UUID,
  similarity REAL
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS qn)
  SELECT
    c.id, c.first_name, c.last_name, c.email, c.phone, c.role_title, c.company_id,
    GREATEST(
      similarity(public.immutable_unaccent(lower(c.first_name || ' ' || c.last_name)), q.qn),
      similarity(public.immutable_unaccent(lower(COALESCE(c.email, ''))), q.qn) * 0.85,
      similarity(public.immutable_unaccent(lower(COALESCE(c.role_title, ''))), q.qn) * 0.6,
      similarity(public.immutable_unaccent(lower(COALESCE(c.notes, ''))), q.qn) * 0.4
    )::real AS similarity
  FROM public.contacts c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.first_name || ' ' || c.last_name)) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.email, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.role_title, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.notes, ''))) ILIKE '%' || q.qn || '%'
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$$;

-- ── search_companies_semantic ─────────────────────
CREATE OR REPLACE FUNCTION public.search_companies_semantic(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_min_similarity REAL DEFAULT 0.15
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  industry TEXT,
  city TEXT,
  state TEXT,
  similarity REAL
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS qn)
  SELECT
    c.id, c.name, c.industry, c.city, c.state,
    GREATEST(
      similarity(public.immutable_unaccent(lower(c.name)), q.qn),
      similarity(public.immutable_unaccent(lower(COALESCE(c.nome_fantasia, ''))), q.qn) * 0.9,
      similarity(public.immutable_unaccent(lower(COALESCE(c.razao_social, ''))), q.qn) * 0.85,
      similarity(public.immutable_unaccent(lower(COALESCE(c.industry, ''))), q.qn) * 0.5,
      similarity(public.immutable_unaccent(lower(COALESCE(c.notes, ''))), q.qn) * 0.4
    )::real AS similarity
  FROM public.companies c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.nome_fantasia, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.razao_social, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.industry, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.notes, ''))) ILIKE '%' || q.qn || '%'
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$$;

-- ── search_interactions_semantic ──────────────────
CREATE OR REPLACE FUNCTION public.search_interactions_semantic(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10,
  p_min_similarity REAL DEFAULT 0.12
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  type TEXT,
  created_at TIMESTAMPTZ,
  contact_id UUID,
  similarity REAL
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS qn)
  SELECT
    i.id, i.title, i.type, i.created_at, i.contact_id,
    GREATEST(
      similarity(public.immutable_unaccent(lower(COALESCE(i.title, ''))), q.qn),
      similarity(public.immutable_unaccent(lower(COALESCE(i.content, ''))), q.qn) * 0.7,
      similarity(public.immutable_unaccent(lower(COALESCE(i.type, ''))), q.qn) * 0.4
    )::real AS similarity
  FROM public.interactions i, q
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(COALESCE(i.title, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(i.content, ''))) ILIKE '%' || q.qn || '%'
      OR public.immutable_unaccent(lower(COALESCE(i.type, ''))) % q.qn
    )
  ORDER BY similarity DESC, i.created_at DESC
  LIMIT p_limit;
$$;