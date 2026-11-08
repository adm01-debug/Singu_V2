-- Migration: Add missing user_id and FK indexes across high-traffic tables
--
-- PostgreSQL does NOT auto-index FK columns. Every unindexed FK means a
-- sequential scan on ownership checks, JOIN clauses, and cascade operations.
-- All tables below were confirmed to have no non-PK index at all, or to have
-- composite UNIQUE constraints whose non-leading FK column is unindexed for
-- standalone lookups.

DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('sequences', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON public.sequences (user_id)'),
      ('nurturing_workflows', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_nurturing_workflows_user_id ON public.nurturing_workflows (user_id)'),
      ('nurturing_enrollments', 'contact_id', 'CREATE INDEX IF NOT EXISTS idx_nurturing_enrollments_contact_id ON public.nurturing_enrollments (contact_id)'),
      ('email_campaigns', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id ON public.email_campaigns (user_id)'),
      ('campaign_recipients', 'contact_id', 'CREATE INDEX IF NOT EXISTS idx_campaign_recipients_contact_id ON public.campaign_recipients (contact_id)'),
      ('support_tickets', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets (user_id)'),
      ('support_tickets', 'contact_id', 'CREATE INDEX IF NOT EXISTS idx_support_tickets_contact_id ON public.support_tickets (contact_id)'),
      ('support_tickets', 'company_id', 'CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id ON public.support_tickets (company_id)'),
      ('ticket_comments', 'ticket_id', 'CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON public.ticket_comments (ticket_id)'),
      ('ticket_comments', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id ON public.ticket_comments (user_id)'),
      ('automation_rules', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON public.automation_rules (user_id)'),
      ('automation_logs', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON public.automation_logs (user_id)'),
      ('automation_logs', 'rule_id', 'CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs (rule_id)'),
      ('health_alerts', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_health_alerts_user_id ON public.health_alerts (user_id)'),
      ('health_alerts', 'contact_id', 'CREATE INDEX IF NOT EXISTS idx_health_alerts_contact_id ON public.health_alerts (contact_id)'),
      ('pipelines', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_pipelines_user_id ON public.pipelines (user_id)'),
      ('canned_responses', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_canned_responses_user_id ON public.canned_responses (user_id)'),
      ('knowledge_base_articles', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_knowledge_base_articles_user_id ON public.knowledge_base_articles (user_id)'),
      ('documents', 'user_id', 'CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents (user_id)'),
      ('contact_cadence', 'contact_id', 'CREATE INDEX IF NOT EXISTS idx_contact_cadence_contact_id ON public.contact_cadence (contact_id)')
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
