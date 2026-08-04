-- Habilitar pg_trgm para busca por similaridade
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Tabela local de produtos (read-only mirror simplificado para busca semântica)
-- Caso já exista uma tabela de produtos externa, esta serve como cache de busca
CREATE TABLE IF NOT EXISTS public.search_products_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  external_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  price NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.search_products_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own products cache"
  ON public.search_products_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own products cache"
  ON public.search_products_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own products cache"
  ON public.search_products_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own products cache"
  ON public.search_products_cache FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_products_name_trgm
  ON public.search_products_cache USING gin (name extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_products_desc_trgm
  ON public.search_products_cache USING gin (description extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_search_products_user ON public.search_products_cache(user_id);

CREATE TRIGGER trg_update_search_products_cache_updated_at
  BEFORE UPDATE ON public.search_products_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC de busca semântica baseada em similaridade trigram + tokens
CREATE OR REPLACE FUNCTION public.search_products_semantic(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_min_similarity REAL DEFAULT 0.1
)
RETURNS TABLE(
  id UUID,
  external_id TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  image_url TEXT,
  price NUMERIC,
  metadata JSONB,
  similarity REAL
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT
    p.id,
    p.external_id,
    p.name,
    p.description,
    p.category,
    p.tags,
    p.image_url,
    p.price,
    p.metadata,
    GREATEST(
      similarity(public.immutable_unaccent(lower(p.name)), public.immutable_unaccent(lower(p_query))),
      similarity(public.immutable_unaccent(lower(COALESCE(p.description, ''))), public.immutable_unaccent(lower(p_query))) * 0.7,
      similarity(public.immutable_unaccent(lower(COALESCE(p.category, ''))), public.immutable_unaccent(lower(p_query))) * 0.5
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
$$;

-- Cache de resultados de busca semântica (TTL gerenciado pela edge function)
CREATE TABLE IF NOT EXISTS public.semantic_search_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, query_hash)
);

ALTER TABLE public.semantic_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own search cache"
  ON public.semantic_search_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own search cache"
  ON public.semantic_search_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own search cache"
  ON public.semantic_search_cache FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_semantic_cache_lookup
  ON public.semantic_search_cache(user_id, query_hash, expires_at);