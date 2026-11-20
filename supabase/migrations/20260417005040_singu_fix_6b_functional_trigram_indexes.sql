-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417005040
-- nome:   singu_fix_6b_functional_trigram_indexes

-- ============================================================================
-- FIX #6b — Indexes FUNCIONAIS sobre immutable_unaccent(lower(...))
-- O index simples em 'name' não serve porque a função aplica unaccent+lower em RUNTIME
-- Precisa de index sobre a expressão exata usada nas queries
-- ============================================================================

-- companies
CREATE INDEX IF NOT EXISTS idx_companies_name_unaccent_trgm 
ON public.companies USING gin (public.immutable_unaccent(lower(name)) extensions.gin_trgm_ops) 
WHERE name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_industry_unaccent_trgm 
ON public.companies USING gin (public.immutable_unaccent(lower(industry)) extensions.gin_trgm_ops) 
WHERE industry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_city_unaccent_trgm 
ON public.companies USING gin (public.immutable_unaccent(lower(city)) extensions.gin_trgm_ops) 
WHERE city IS NOT NULL;

-- contacts
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_unaccent_trgm 
ON public.contacts USING gin (public.immutable_unaccent(lower(first_name)) extensions.gin_trgm_ops) 
WHERE first_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_last_name_unaccent_trgm 
ON public.contacts USING gin (public.immutable_unaccent(lower(last_name)) extensions.gin_trgm_ops) 
WHERE last_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_email_unaccent_trgm 
ON public.contacts USING gin (public.immutable_unaccent(lower(email)) extensions.gin_trgm_ops) 
WHERE email IS NOT NULL;

-- interactions
CREATE INDEX IF NOT EXISTS idx_interactions_title_unaccent_trgm 
ON public.interactions USING gin (public.immutable_unaccent(lower(title)) extensions.gin_trgm_ops) 
WHERE title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_content_unaccent_trgm 
ON public.interactions USING gin (public.immutable_unaccent(lower(content)) extensions.gin_trgm_ops) 
WHERE content IS NOT NULL;
