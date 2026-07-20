-- Migration: Add missing indexes on foreign-key columns
--
-- PostgreSQL does NOT automatically create indexes on FK columns. Without these
-- indexes every FK-constrained lookup (JOIN, cascade check, filter by FK) does a
-- sequential scan of the child table. The tables below are the highest-impact gaps
-- found in the FK audit:
--
--   Priority A – deals (central CRM entity, joined to contacts/companies/pipelines
--                on virtually every CRM query)
--   Priority B – other tables with FK columns used in WHERE / JOIN clauses that
--                currently require a sequential scan

-- =============================================================================
-- A. deals — FK columns with no supporting index
-- Only idx_deals_user_created(user_id, created_at DESC) exists.
-- The four FK columns below are used in JOINs and filtered queries constantly.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_deals_contact_id   ON public.deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_company_id   ON public.deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id  ON public.deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id     ON public.deals(stage_id);

-- =============================================================================
-- B. document_signatures — FK columns missing indexes
-- Existing indexes cover only (user_id), (signature_token), (user_id, status).
-- template_id / contact_id / company_id are FKs with no index.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_doc_signatures_template_id ON public.document_signatures(template_id);
CREATE INDEX IF NOT EXISTS idx_doc_signatures_contact_id  ON public.document_signatures(contact_id);
CREATE INDEX IF NOT EXISTS idx_doc_signatures_company_id  ON public.document_signatures(company_id);

-- =============================================================================
-- C. sequence_send_log — step_id and sequence_id FK columns
-- Existing indexes: enrollment_id, tracking_token, (user_id, sent_at DESC).
-- step_id and sequence_id are FK-constrained but unindexed.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_seq_send_log_step_id     ON public.sequence_send_log(step_id);
CREATE INDEX IF NOT EXISTS idx_seq_send_log_sequence_id ON public.sequence_send_log(sequence_id);

-- =============================================================================
-- D. mql_classifications — criteria_id FK column
-- Existing indexes: user_id, contact_id, status — but not criteria_id.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_mqlcls_criteria_id ON public.mql_classifications(criteria_id);

-- =============================================================================
-- E. custom_field_values — entity_id lookup column
-- UNIQUE(custom_field_id, entity_id) serves lookups leading with custom_field_id.
-- Lookups leading with entity_id (e.g., "all custom fields for contact X") have
-- no index and do a sequential scan.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity_id ON public.custom_field_values(entity_id);

-- =============================================================================
-- F. sales_team_members — manager_id self-referential FK
-- Queries like "find all reports of manager X" require a sequential scan.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_sales_team_manager_id ON public.sales_team_members(manager_id);

-- =============================================================================
-- G. whatsapp_transcriptions — whatsapp_message_id FK column
-- The table has a NOT NULL FK to whatsapp_messages(id) but no index on it.
-- Lookups by message ID (e.g., fetching transcript for a given message) scan
-- the full table without this index.
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_whatsapp_transcriptions_message_id
  ON public.whatsapp_transcriptions(whatsapp_message_id);
