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

DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('deals', 'contact_id', 'CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON public.deals(contact_id)'),
      ('deals', 'company_id', 'CREATE INDEX IF NOT EXISTS idx_deals_company_id ON public.deals(company_id)'),
      ('deals', 'pipeline_id', 'CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON public.deals(pipeline_id)'),
      ('deals', 'stage_id', 'CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON public.deals(stage_id)'),
      ('document_signatures', 'template_id', 'CREATE INDEX IF NOT EXISTS idx_doc_signatures_template_id ON public.document_signatures(template_id)'),
      ('document_signatures', 'contact_id', 'CREATE INDEX IF NOT EXISTS idx_doc_signatures_contact_id ON public.document_signatures(contact_id)'),
      ('document_signatures', 'company_id', 'CREATE INDEX IF NOT EXISTS idx_doc_signatures_company_id ON public.document_signatures(company_id)'),
      ('sequence_send_log', 'step_id', 'CREATE INDEX IF NOT EXISTS idx_seq_send_log_step_id ON public.sequence_send_log(step_id)'),
      ('sequence_send_log', 'sequence_id', 'CREATE INDEX IF NOT EXISTS idx_seq_send_log_sequence_id ON public.sequence_send_log(sequence_id)'),
      ('mql_classifications', 'criteria_id', 'CREATE INDEX IF NOT EXISTS idx_mqlcls_criteria_id ON public.mql_classifications(criteria_id)'),
      ('custom_field_values', 'entity_id', 'CREATE INDEX IF NOT EXISTS idx_custom_field_values_entity_id ON public.custom_field_values(entity_id)'),
      ('sales_team_members', 'manager_id', 'CREATE INDEX IF NOT EXISTS idx_sales_team_manager_id ON public.sales_team_members(manager_id)'),
      ('whatsapp_transcriptions', 'whatsapp_message_id', 'CREATE INDEX IF NOT EXISTS idx_whatsapp_transcriptions_message_id ON public.whatsapp_transcriptions(whatsapp_message_id)')
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
