-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321184838
-- nome:   create_indexes_fk_high_volume

-- ============================================================
-- P1: Índices em FKs de alto volume sem índice
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_companies_created_by_id
  ON public.companies (created_by_id);

CREATE INDEX IF NOT EXISTS idx_customers_sdr_id
  ON public.customers (sdr_id);

CREATE INDEX IF NOT EXISTS idx_company_rfm_scores_segment_id
  ON public.company_rfm_scores (segment_id);

CREATE INDEX IF NOT EXISTS idx_contacts_duplicate_of
  ON public.contacts (duplicate_of);

CREATE INDEX IF NOT EXISTS idx_contacts_assigned_by_id
  ON public.contacts (assigned_by_id);
