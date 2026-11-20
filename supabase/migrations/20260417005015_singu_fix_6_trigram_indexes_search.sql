-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417005015
-- nome:   singu_fix_6_trigram_indexes_search

-- ============================================================================
-- FIX #6 — Indexes trigram em contacts e interactions para performance
-- Sem esses indexes, search_contacts_unaccent/search_interactions_unaccent vira seq scan
-- ============================================================================

-- Contacts: first_name, last_name (pode ser string longa)
CREATE INDEX IF NOT EXISTS idx_contacts_first_name_trgm 
ON public.contacts USING gin (first_name extensions.gin_trgm_ops) 
WHERE first_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_last_name_trgm 
ON public.contacts USING gin (last_name extensions.gin_trgm_ops) 
WHERE last_name IS NOT NULL;

-- Contacts.email: buscas por parte do email
CREATE INDEX IF NOT EXISTS idx_contacts_email_trgm 
ON public.contacts USING gin (email extensions.gin_trgm_ops) 
WHERE email IS NOT NULL;

-- Interactions: title e content podem ter busca de texto
CREATE INDEX IF NOT EXISTS idx_interactions_title_trgm 
ON public.interactions USING gin (title extensions.gin_trgm_ops) 
WHERE title IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interactions_content_trgm 
ON public.interactions USING gin (content extensions.gin_trgm_ops) 
WHERE content IS NOT NULL;
