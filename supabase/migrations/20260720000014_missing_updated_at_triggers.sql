-- Migration: Add missing BEFORE UPDATE triggers for updated_at on 13 business-entity tables
--
-- Without these triggers, updated_at stays at its INSERT timestamp unless the
-- application explicitly sets it on every UPDATE — which application code rarely
-- does reliably. These are all mutable entity tables (not append-only log/history
-- tables), so stale updated_at values mislead cache-busting, audit trails, and
-- incremental-sync logic.

CREATE OR REPLACE TRIGGER trg_sequences_updated_at
  BEFORE UPDATE ON public.sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sequence_steps_updated_at
  BEFORE UPDATE ON public.sequence_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_nurturing_workflows_updated_at
  BEFORE UPDATE ON public.nurturing_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_crm_cadence_rules_updated_at
  BEFORE UPDATE ON public.crm_cadence_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_knowledge_base_articles_updated_at
  BEFORE UPDATE ON public.knowledge_base_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_canned_responses_updated_at
  BEFORE UPDATE ON public.canned_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_deal_room_activities_updated_at
  BEFORE UPDATE ON public.deal_room_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_deal_room_comments_updated_at
  BEFORE UPDATE ON public.deal_room_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_follow_up_approvals_v2_updated_at
  BEFORE UPDATE ON public.follow_up_approvals_v2
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_weekly_reports_updated_at
  BEFORE UPDATE ON public.weekly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_social_behavior_analysis_updated_at
  BEFORE UPDATE ON public.social_behavior_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sms_campaign_recipients_updated_at
  BEFORE UPDATE ON public.sms_campaign_recipients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_health_alerts_updated_at
  BEFORE UPDATE ON public.health_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
