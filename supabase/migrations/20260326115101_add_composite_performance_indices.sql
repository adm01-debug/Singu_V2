-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260326115101
-- nome:   add_composite_performance_indices

-- Composite indices for common query patterns in the CRM application
-- These target the most frequent queries identified in the code audit

-- contacts: user_id + created_at (dashboard listings, sorted by date)
CREATE INDEX IF NOT EXISTS idx_contacts_user_created 
ON public.contacts (user_id, created_at DESC);

-- contacts: company_id + user_id (contacts per company per user)
CREATE INDEX IF NOT EXISTS idx_contacts_company_user 
ON public.contacts (company_id, user_id);

-- interactions: user_id + created_at (interaction feed, sorted by date)
CREATE INDEX IF NOT EXISTS idx_interactions_user_created 
ON public.interactions (user_id, created_at DESC);

-- interactions: contact_id + created_at (contact timeline)
CREATE INDEX IF NOT EXISTS idx_interactions_contact_created 
ON public.interactions (contact_id, created_at DESC);

-- interactions: company_id + created_at (company timeline)
CREATE INDEX IF NOT EXISTS idx_interactions_company_created 
ON public.interactions (company_id, created_at DESC);

-- company_rfm_scores: user_id + company_id (RFM lookup, most queried)
CREATE INDEX IF NOT EXISTS idx_company_rfm_user_company 
ON public.company_rfm_scores (user_id, company_id);

-- alerts: user_id + status + created_at (unread alerts feed)
CREATE INDEX IF NOT EXISTS idx_alerts_user_status_created 
ON public.alerts (user_id, status, created_at DESC);

-- activities: user_id + created_at (activity feed)
CREATE INDEX IF NOT EXISTS idx_activities_user_created 
ON public.activities (user_id, created_at DESC);

-- company_addresses: company_id + is_primary (primary address lookup)
CREATE INDEX IF NOT EXISTS idx_company_addresses_primary 
ON public.company_addresses (company_id, is_primary);
