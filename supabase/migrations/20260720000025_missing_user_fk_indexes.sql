-- Migration: Add missing user_id and FK indexes across high-traffic tables
--
-- PostgreSQL does NOT auto-index FK columns. Every unindexed FK means a
-- sequential scan on ownership checks, JOIN clauses, and cascade operations.
-- All tables below were confirmed to have no non-PK index at all, or to have
-- composite UNIQUE constraints whose non-leading FK column is unindexed for
-- standalone lookups.

-- ── sequences (user_id) ──────────────────────────────────────────────────────
-- All sequence reads/writes are scoped by user_id; no index existed.
CREATE INDEX IF NOT EXISTS idx_sequences_user_id
  ON public.sequences (user_id);

-- ── nurturing_workflows (user_id) ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nurturing_workflows_user_id
  ON public.nurturing_workflows (user_id);

-- ── nurturing_enrollments (contact_id) ───────────────────────────────────────
-- UNIQUE(workflow_id, contact_id) serves leading-workflow lookups only.
-- "All nurturing workflows for contact X" requires scanning every row.
CREATE INDEX IF NOT EXISTS idx_nurturing_enrollments_contact_id
  ON public.nurturing_enrollments (contact_id);

-- ── email_campaigns (user_id) ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_email_campaigns_user_id
  ON public.email_campaigns (user_id);

-- ── campaign_recipients (contact_id) ─────────────────────────────────────────
-- UNIQUE(campaign_id, contact_id) leaves contact_id as non-leading.
-- "All campaigns for contact X" requires a full scan without this index.
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_contact_id
  ON public.campaign_recipients (contact_id);

-- ── support_tickets (user_id, contact_id, company_id) ────────────────────────
-- Four FK columns, none indexed. Most ticket queries filter by user_id first,
-- but contact/company JOINs also need supporting indexes.
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id
  ON public.support_tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_contact_id
  ON public.support_tickets (contact_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_company_id
  ON public.support_tickets (company_id);

-- ── ticket_comments (ticket_id, user_id) ─────────────────────────────────────
-- Listing all comments for a ticket is the canonical query; ticket_id unindexed.
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id
  ON public.ticket_comments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id
  ON public.ticket_comments (user_id);

-- ── automation_rules (user_id) ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id
  ON public.automation_rules (user_id);

-- ── automation_logs (user_id, rule_id) ───────────────────────────────────────
-- Logs are queried per user AND per rule; both FKs need indexes.
CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id
  ON public.automation_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id
  ON public.automation_logs (rule_id);

-- ── health_alerts (user_id, contact_id) ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_health_alerts_user_id
  ON public.health_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_health_alerts_contact_id
  ON public.health_alerts (contact_id);

-- ── pipelines (user_id) ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pipelines_user_id
  ON public.pipelines (user_id);

-- ── canned_responses (user_id) ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_canned_responses_user_id
  ON public.canned_responses (user_id);

-- ── knowledge_base_articles (user_id) ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_knowledge_base_articles_user_id
  ON public.knowledge_base_articles (user_id);

-- ── documents (user_id) ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_user_id
  ON public.documents (user_id);

-- ── contact_cadence (contact_id) ─────────────────────────────────────────────
-- UNIQUE(user_id, contact_id): user_id is the leading column.
-- "Find cadence for contact X across all users" (FK cascade check) is unindexed.
CREATE INDEX IF NOT EXISTS idx_contact_cadence_contact_id
  ON public.contact_cadence (contact_id);
