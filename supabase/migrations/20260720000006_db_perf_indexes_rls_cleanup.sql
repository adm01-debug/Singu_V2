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

DO $migration$
BEGIN
  IF to_regclass('public.asia_upload_mapping') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.asia_upload_mapping ENABLE ROW LEVEL SECURITY';
  END IF;
  IF to_regclass('public.sm_upload_mapping') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.sm_upload_mapping ENABLE ROW LEVEL SECURITY';
  END IF;
  IF to_regclass('public.xbz_upload_mapping') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.xbz_upload_mapping ENABLE ROW LEVEL SECURITY';
  END IF;
END;
$migration$;

-- ============================================================
-- PART 2 — Add missing indexes on FK columns
-- Each FK column without a supporting index causes a sequential scan
-- on every ON DELETE CASCADE check and every JOIN against the parent.
-- ============================================================

DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('cadence_enrollments', 'cadence_id', 'CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_cadence_id ON public.cadence_enrollments(cadence_id)'),
      ('carrier_score_history', 'carrier_id', 'CREATE INDEX IF NOT EXISTS idx_carrier_score_history_carrier_id ON public.carrier_score_history(carrier_id)'),
      ('customer_health_scores', 'company_id', 'CREATE INDEX IF NOT EXISTS idx_customer_health_scores_company_id ON public.customer_health_scores(company_id)'),
      ('deal_competitors', 'deal_id', 'CREATE INDEX IF NOT EXISTS idx_deal_competitors_deal_id ON public.deal_competitors(deal_id)'),
      ('lead_score_history', 'company_id', 'CREATE INDEX IF NOT EXISTS idx_lead_score_history_company_id ON public.lead_score_history(company_id)'),
      ('pipeline_stages', 'pipeline_id', 'CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON public.pipeline_stages(pipeline_id)'),
      ('product_novelties', 'supplier_id', 'CREATE INDEX IF NOT EXISTS idx_product_novelties_supplier_id ON public.product_novelties(supplier_id)'),
      ('reminders', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id)'),
      ('sales_opportunities', 'assigned_to', 'CREATE INDEX IF NOT EXISTS idx_sales_opportunities_assigned_to ON public.sales_opportunities(assigned_to)'),
      ('scheduled_visits', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_scheduled_visits_user_id ON public.scheduled_visits(user_id)'),
      ('seller_daily_metrics', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_seller_daily_metrics_user_id ON public.seller_daily_metrics(user_id)'),
      ('supplier_score_history', 'supplier_id', 'CREATE INDEX IF NOT EXISTS idx_supplier_score_history_supplier_id ON public.supplier_score_history(supplier_id)'),
      ('territory_assignments', 'territory_id', 'CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory_id ON public.territory_assignments(territory_id)')
    ) AS indexes(table_name, column_name, ddl)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', index_definition.table_name))
        AND attname = index_definition.column_name
        AND NOT attisdropped
    ) THEN
      EXECUTE index_definition.ddl;
    END IF;
  END LOOP;
END;
$migration$;

-- ============================================================
-- PART 3 — Drop redundant audit_log indexes
-- idx_audit_log_user_id (user_id) is made redundant by
--   idx_audit_log_user (user_id, created_at DESC) — Postgres uses
--   composite indexes for leading-column predicates.
-- idx_audit_log_table_name (table_name) is made redundant by
--   idx_audit_log_table_action (table_name, action, created_at DESC).
-- Dropping saves ~4.6 MB on disk and one extra B-tree write per INSERT.
-- ============================================================

DROP INDEX IF EXISTS public.idx_audit_log_user_id;
DROP INDEX IF EXISTS public.idx_audit_log_table_name;
