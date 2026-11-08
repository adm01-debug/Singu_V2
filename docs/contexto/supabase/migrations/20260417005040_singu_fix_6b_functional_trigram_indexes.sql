-- ============================================================================
-- FIX #6b — Indexes FUNCIONAIS sobre immutable_unaccent(lower(...))
-- O index simples em 'name' não serve porque a função aplica unaccent+lower em RUNTIME
-- Precisa de index sobre a expressão exata usada nas queries
-- ============================================================================

-- companies
CREATE INDEX IF NOT EXISTS idx_companies_name_unaccent_trgm 
ON public.companies USING gin (public.immutable_unaccent(lower(name)) public.gin_trgm_ops) 
WHERE name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_industry_unaccent_trgm 
ON public.companies USING gin (public.immutable_unaccent(lower(industry)) public.gin_trgm_ops) 
WHERE industry IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_city_unaccent_trgm 
ON public.companies USING gin (public.immutable_unaccent(lower(city)) public.gin_trgm_ops) 
WHERE city IS NOT NULL;

-- contacts
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_unaccent_trgm 
ON public.contacts USING gin (public.immutable_unaccent(lower(first_name)) public.gin_trgm_ops) 
WHERE first_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_last_name_unaccent_trgm 
ON public.contacts USING gin (public.immutable_unaccent(lower(last_name)) public.gin_trgm_ops) 
WHERE last_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_email_unaccent_trgm 
ON public.contacts USING gin (public.immutable_unaccent(lower(email)) public.gin_trgm_ops) 
WHERE email IS NOT NULL;

-- interactions
CREATE INDEX IF NOT EXISTS idx_interactions_title_unaccent_trgm 
ON public.interactions USING gin (public.immutable_unaccent(lower(title)) public.gin_trgm_ops) 
WHERE title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_content_unaccent_trgm 
ON public.interactions USING gin (public.immutable_unaccent(lower(content)) public.gin_trgm_ops) 
WHERE content IS NOT NULL;
