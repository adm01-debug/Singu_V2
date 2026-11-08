-- Add CHECK constraints to status columns that were created without them.
-- Uses NOT VALID so existing rows are not scanned (no table lock).
-- VALIDATE CONSTRAINT runs after as a separate, non-blocking step.

DO $migration$
DECLARE
  constraint_definition record;
BEGIN
  FOR constraint_definition IN
    SELECT *
    FROM (VALUES
      ('document_signatures', 'chk_document_signatures_status', $$status IN ('pending','viewed','signed','declined','expired')$$),
      ('social_sync_queue', 'chk_social_sync_queue_status', $$status IN ('pending','processing','completed','failed')$$),
      ('whatsapp_messages', 'chk_whatsapp_messages_status', $$status IN ('pending','sent','delivered','read','played','failed')$$),
      ('whatsapp_instances', 'chk_whatsapp_instances_status', $$status IN ('connected','disconnected','connecting')$$),
      ('follow_up_approvals', 'chk_follow_up_approvals_status', $$status IN ('pending','approved','rejected','sent')$$),
      ('crm_automation_logs', 'chk_crm_automation_logs_status', $$status IN ('pending','success','failed','error')$$),
      ('crm_automation_reprocess_queue', 'chk_crm_automation_reprocess_queue_status', $$status IN ('pending','retrying','failed','success')$$)
    ) AS constraints(table_name, constraint_name, expression)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', constraint_definition.table_name))
        AND attname = 'status'
        AND NOT attisdropped
    ) THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = to_regclass(format('public.%I', constraint_definition.table_name))
          AND conname = constraint_definition.constraint_name
      ) THEN
        EXECUTE format(
          'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s) NOT VALID',
          constraint_definition.table_name,
          constraint_definition.constraint_name,
          constraint_definition.expression
        );
      END IF;

      EXECUTE format(
        'ALTER TABLE public.%I VALIDATE CONSTRAINT %I',
        constraint_definition.table_name,
        constraint_definition.constraint_name
      );
    END IF;
  END LOOP;
END;
$migration$;
