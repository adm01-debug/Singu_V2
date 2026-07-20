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

-- Notification inbox: WHERE user_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

-- Deal pipeline: WHERE user_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_deals_user_created
  ON public.deals(user_id, created_at DESC);

-- Task list (all tasks): WHERE user_id = $1 ORDER BY created_at DESC
-- (existing idx_tasks_pending covers status=pending+due_date, but not the general list)
CREATE INDEX IF NOT EXISTS idx_tasks_user_created
  ON public.tasks(user_id, created_at DESC);

-- Ficha-360 insights panel: WHERE contact_id = $1 ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_insights_contact_created
  ON public.insights(contact_id, created_at DESC);

-- Relationship score history: latest score per contact
-- (existing idx_score_history_contact + idx_score_history_measured are separate;
--  composite eliminates the sort step)
CREATE INDEX IF NOT EXISTS idx_relationship_score_history_contact_measured
  ON public.relationship_score_history(contact_id, measured_at DESC);

-- ============================================================
-- PART 3 — Add updated_at BEFORE UPDATE triggers for 24 tables
-- All use the existing update_updated_at_column() trigger function.
-- Without these triggers, updated_at stays at its INSERT value
-- unless the application explicitly sets it on every UPDATE.
-- ============================================================

CREATE OR REPLACE TRIGGER trg_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_company_cadences_updated_at
  BEFORE UPDATE ON public.company_cadences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_csat_surveys_updated_at
  BEFORE UPDATE ON public.csat_surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_custom_fields_updated_at
  BEFORE UPDATE ON public.custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_economic_groups_updated_at
  BEFORE UPDATE ON public.economic_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_inactivity_alerts_updated_at
  BEFORE UPDATE ON public.inactivity_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_interaction_templates_updated_at
  BEFORE UPDATE ON public.interaction_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_quick_notes_updated_at
  BEFORE UPDATE ON public.quick_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sales_cadences_updated_at
  BEFORE UPDATE ON public.sales_cadences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sales_forecasts_updated_at
  BEFORE UPDATE ON public.sales_forecasts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sales_goals_updated_at
  BEFORE UPDATE ON public.sales_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sales_opportunities_updated_at
  BEFORE UPDATE ON public.sales_opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_smart_segments_updated_at
  BEFORE UPDATE ON public.smart_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_user_goals_updated_at
  BEFORE UPDATE ON public.user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
