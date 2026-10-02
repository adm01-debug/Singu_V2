-- Migration: Add missing indexes for pipeline and notification hot paths
--
-- Identified gaps via pg_stats + index audit:
--   deals.pipeline_stage  — no index, scanned on every Kanban board load
--   insights.dismissed    — no index, scanned for dismissed=false notification query
--   health_alerts.dismissed — same pattern
--   stakeholder_alerts.company_id — no index for company-scoped filters
--   alerts (user_id+dismissed) — repeated in useRealtimeNotifications initial load

DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('deals', ARRAY['pipeline_stage'], 'CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage ON public.deals (pipeline_stage)'),
      ('insights', ARRAY['user_id', 'created_at', 'dismissed'], 'CREATE INDEX IF NOT EXISTS idx_insights_not_dismissed ON public.insights (user_id, created_at DESC) WHERE dismissed = false'),
      ('health_alerts', ARRAY['user_id', 'created_at', 'dismissed'], 'CREATE INDEX IF NOT EXISTS idx_health_alerts_not_dismissed ON public.health_alerts (user_id, created_at DESC) WHERE dismissed = false'),
      ('alerts', ARRAY['user_id', 'created_at', 'dismissed'], 'CREATE INDEX IF NOT EXISTS idx_alerts_user_not_dismissed ON public.alerts (user_id, created_at DESC) WHERE dismissed = false'),
      ('stakeholder_alerts', ARRAY['company_id'], 'CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_company_id ON public.stakeholder_alerts (company_id)')
    ) AS indexes(table_name, column_names, ddl)
  LOOP
    IF (
      SELECT count(*) = cardinality(index_definition.column_names)
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', index_definition.table_name))
        AND attname = ANY(index_definition.column_names)
        AND NOT attisdropped
    ) THEN
      EXECUTE index_definition.ddl;
    END IF;
  END LOOP;
END;
$migration$;
