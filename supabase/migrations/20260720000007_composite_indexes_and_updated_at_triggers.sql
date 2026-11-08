-- Migration: composite indexes for hot query patterns + updated_at triggers for 24 tables
-- Addresses:
--   1. 5 missing composite indexes on frequently-queried (user_id/contact_id + timestamp) columns
--   2. 1 duplicate notification index (identical definition, 0 scans each)
--   3. 24 tables with updated_at column but no BEFORE UPDATE trigger to keep it current

-- ============================================================
-- PART 1 — Drop duplicate notification index
-- idx_notifications_unread and idx_notifications_user_unread are
-- identical: (user_id, is_read) WHERE is_read = false. Both had 0 scans.
-- Keep the more descriptive name: idx_notifications_user_unread.
-- ============================================================

DROP INDEX IF EXISTS public.idx_notifications_unread;

-- ============================================================
-- PART 2 — Add missing composite indexes for hot query patterns
-- Single-column indexes cannot serve ORDER BY on a second column
-- efficiently; the planner would need a separate sort step.
-- ============================================================

DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('notifications', ARRAY['user_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC)'),
      ('deals', ARRAY['user_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_deals_user_created ON public.deals(user_id, created_at DESC)'),
      ('tasks', ARRAY['user_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON public.tasks(user_id, created_at DESC)'),
      ('insights', ARRAY['contact_id', 'created_at'], 'CREATE INDEX IF NOT EXISTS idx_insights_contact_created ON public.insights(contact_id, created_at DESC)'),
      ('relationship_score_history', ARRAY['contact_id', 'measured_at'], 'CREATE INDEX IF NOT EXISTS idx_relationship_score_history_contact_measured ON public.relationship_score_history(contact_id, measured_at DESC)')
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

-- ============================================================
-- PART 3 — Add updated_at BEFORE UPDATE triggers for 24 tables
-- All use the existing update_updated_at_column() trigger function.
-- Without these triggers, updated_at stays at its INSERT value
-- unless the application explicitly sets it on every UPDATE.
-- ============================================================

DO $migration$
DECLARE
  trigger_definition record;
BEGIN
  FOR trigger_definition IN
    SELECT *
    FROM (VALUES
      ('automations', 'trg_automations_updated_at'),
      ('calendar_events', 'trg_calendar_events_updated_at'),
      ('campaigns', 'trg_campaigns_updated_at'),
      ('company_cadences', 'trg_company_cadences_updated_at'),
      ('csat_surveys', 'trg_csat_surveys_updated_at'),
      ('custom_field_values', 'trg_custom_field_values_updated_at'),
      ('custom_fields', 'trg_custom_fields_updated_at'),
      ('documents', 'trg_documents_updated_at'),
      ('economic_groups', 'trg_economic_groups_updated_at'),
      ('inactivity_alerts', 'trg_inactivity_alerts_updated_at'),
      ('integrations', 'trg_integrations_updated_at'),
      ('interaction_templates', 'trg_interaction_templates_updated_at'),
      ('message_templates', 'trg_message_templates_updated_at'),
      ('products', 'trg_products_updated_at'),
      ('proposals', 'trg_proposals_updated_at'),
      ('quick_notes', 'trg_quick_notes_updated_at'),
      ('sales_cadences', 'trg_sales_cadences_updated_at'),
      ('sales_forecasts', 'trg_sales_forecasts_updated_at'),
      ('sales_goals', 'trg_sales_goals_updated_at'),
      ('sales_opportunities', 'trg_sales_opportunities_updated_at'),
      ('smart_segments', 'trg_smart_segments_updated_at'),
      ('tasks', 'trg_tasks_updated_at'),
      ('user_goals', 'trg_user_goals_updated_at'),
      ('whatsapp_messages', 'trg_whatsapp_messages_updated_at')
    ) AS triggers(table_name, trigger_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', trigger_definition.table_name))
        AND attname = 'updated_at'
        AND NOT attisdropped
    ) THEN
      EXECUTE format(
        'CREATE OR REPLACE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
        trigger_definition.trigger_name,
        trigger_definition.table_name
      );
    END IF;
  END LOOP;
END;
$migration$;
