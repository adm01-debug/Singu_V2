-- Migration: Add missing BEFORE UPDATE triggers for updated_at on 13 business-entity tables
--
-- Without these triggers, updated_at stays at its INSERT timestamp unless the
-- application explicitly sets it on every UPDATE — which application code rarely
-- does reliably. These are all mutable entity tables (not append-only log/history
-- tables), so stale updated_at values mislead cache-busting, audit trails, and
-- incremental-sync logic.

DO $migration$
DECLARE
  trigger_definition record;
BEGIN
  FOR trigger_definition IN
    SELECT *
    FROM (VALUES
      ('sequences', 'trg_sequences_updated_at'),
      ('sequence_steps', 'trg_sequence_steps_updated_at'),
      ('nurturing_workflows', 'trg_nurturing_workflows_updated_at'),
      ('crm_cadence_rules', 'trg_crm_cadence_rules_updated_at'),
      ('knowledge_base_articles', 'trg_knowledge_base_articles_updated_at'),
      ('support_tickets', 'trg_support_tickets_updated_at'),
      ('canned_responses', 'trg_canned_responses_updated_at'),
      ('activities', 'trg_activities_updated_at'),
      ('deal_room_activities', 'trg_deal_room_activities_updated_at'),
      ('deal_room_comments', 'trg_deal_room_comments_updated_at'),
      ('follow_up_approvals_v2', 'trg_follow_up_approvals_v2_updated_at'),
      ('weekly_reports', 'trg_weekly_reports_updated_at'),
      ('social_behavior_analysis', 'trg_social_behavior_analysis_updated_at'),
      ('sms_campaign_recipients', 'trg_sms_campaign_recipients_updated_at'),
      ('alerts', 'trg_alerts_updated_at'),
      ('health_alerts', 'trg_health_alerts_updated_at')
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
