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
