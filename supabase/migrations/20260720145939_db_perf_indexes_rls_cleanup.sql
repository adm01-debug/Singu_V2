-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260720145939
-- nome:   db_perf_indexes_rls_cleanup

-- Migration: DB performance, RLS hardening, and index cleanup
-- Addresses:
--   1. 13 FK columns without supporting indexes (slow JOINs)
--   2. 3 internal tables with RLS disabled (data exposure)
--   3. 2 redundant audit_log indexes (wasted write overhead + ~4.6 MB)

-- ============================================================
-- PART 1 — Enable RLS on internal upload-mapping tables
-- These are service-only tables (no user_id column).
-- Enabling RLS with no permissive policies means anon/authenticated
-- JWTs cannot access them at all; service_role bypasses RLS by design.
-- ============================================================

ALTER TABLE public.asia_upload_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sm_upload_mapping   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xbz_upload_mapping  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2 — Add missing indexes on FK columns
-- Each FK column without a supporting index causes a sequential scan
-- on every ON DELETE CASCADE check and every JOIN against the parent.
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_cadence_id
  ON public.cadence_enrollments(cadence_id);

CREATE INDEX IF NOT EXISTS idx_carrier_score_history_carrier_id
  ON public.carrier_score_history(carrier_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relname='customer_health_scores') THEN
    CREATE INDEX IF NOT EXISTS idx_customer_health_scores_company_id
      ON public.customer_health_scores(company_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deal_competitors_deal_id
  ON public.deal_competitors(deal_id);

-- Compat: producao tem company_id (types.ts); o DDL de junho nao o criou.
ALTER TABLE public.lead_score_history ADD COLUMN IF NOT EXISTS company_id UUID;

CREATE INDEX IF NOT EXISTS idx_lead_score_history_company_id
  ON public.lead_score_history(company_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id
  ON public.pipeline_stages(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_product_novelties_supplier_id
  ON public.product_novelties(supplier_id);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id
  ON public.reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_sales_opportunities_assigned_to
  ON public.sales_opportunities(assigned_to);

CREATE INDEX IF NOT EXISTS idx_scheduled_visits_user_id
  ON public.scheduled_visits(user_id);

CREATE INDEX IF NOT EXISTS idx_seller_daily_metrics_user_id
  ON public.seller_daily_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_supplier_score_history_supplier_id
  ON public.supplier_score_history(supplier_id);

CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory_id
  ON public.territory_assignments(territory_id);

-- ============================================================
-- PART 3 — Drop redundant audit_log indexes
-- idx_audit_log_user_id (user_id) is made redundant by
--   idx_audit_log_user (user_id, created_at DESC)
-- idx_audit_log_table_name (table_name) is made redundant by
--   idx_audit_log_table_action (table_name, action, created_at DESC)
-- ============================================================

DROP INDEX IF EXISTS public.idx_audit_log_user_id;
DROP INDEX IF EXISTS public.idx_audit_log_table_name;
