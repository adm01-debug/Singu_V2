-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416221435
-- nome:   singu_create_cache_tables

-- ============================================================================
-- SINGU — CACHE TABLES (2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.search_products_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  query_hash text NOT NULL,
  query_text text,
  source text NOT NULL CHECK (source IN ('xbz','stricker','spot','multi','other')),
  results jsonb NOT NULL,
  result_count integer,
  cache_hit_count integer DEFAULT 0,
  last_accessed_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '6 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_query_cache UNIQUE (query_hash, source)
);
COMMENT ON TABLE public.search_products_cache IS 'SINGU: Cache de buscas de produtos por fornecedor (XBZ/Stricker/SPOT). TTL 6h. query_hash para dedup.';

ALTER TABLE public.search_products_cache
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS query_hash text NOT NULL,
  ADD COLUMN IF NOT EXISTS query_text text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL CHECK (source IN ('xbz','stricker','spot','multi','other')),
  ADD COLUMN IF NOT EXISTS results jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS result_count integer,
  ADD COLUMN IF NOT EXISTS cache_hit_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '6 hours'),
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();


CREATE TABLE IF NOT EXISTS public.semantic_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  query_text text NOT NULL,
  query_embedding_hash text NOT NULL,
  entity_type text CHECK (entity_type IN ('contact','company','product','document','article','all')),
  results jsonb NOT NULL,
  similarity_threshold numeric(4,3) DEFAULT 0.75,
  result_count integer,
  cache_hit_count integer DEFAULT 0,
  last_accessed_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_semantic_cache UNIQUE (query_embedding_hash, entity_type)
);
COMMENT ON TABLE public.semantic_search_cache IS 'SINGU: Cache de buscas semânticas (embedding-based) com TTL 24h. query_embedding_hash para matching determinístico.';

ALTER TABLE public.semantic_search_cache
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS query_text text NOT NULL,
  ADD COLUMN IF NOT EXISTS query_embedding_hash text NOT NULL,
  ADD COLUMN IF NOT EXISTS entity_type text CHECK (entity_type IN ('contact','company','product','document','article','all')),
  ADD COLUMN IF NOT EXISTS results jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS similarity_threshold numeric(4,3) DEFAULT 0.75,
  ADD COLUMN IF NOT EXISTS result_count integer,
  ADD COLUMN IF NOT EXISTS cache_hit_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_search_products_cache_hash ON public.search_products_cache (query_hash, source);
CREATE INDEX IF NOT EXISTS idx_search_products_cache_expires ON public.search_products_cache (expires_at);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_hash ON public.semantic_search_cache (query_embedding_hash);
CREATE INDEX IF NOT EXISTS idx_semantic_cache_expires ON public.semantic_search_cache (expires_at);

-- RLS: caches são compartilháveis (read público, write só service_role)
ALTER TABLE public.search_products_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semantic_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read" ON public.search_products_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_role_full" ON public.search_products_cache FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read" ON public.semantic_search_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_role_full" ON public.semantic_search_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
