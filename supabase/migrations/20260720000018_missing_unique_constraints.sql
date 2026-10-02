-- Add UNIQUE constraints required by upsert operations that use ON CONFLICT.
-- Without these, upsert ON CONFLICT clauses silently do nothing or error.

-- social_behavior_analysis: upserted by social-behavior-analyzer and
-- generate-behavioral-profile functions using onConflict: 'contact_id'.
DO $migration$
DECLARE
  constraint_definition record;
BEGIN
  FOR constraint_definition IN
    SELECT *
    FROM (VALUES
      ('social_behavior_analysis', 'contact_id', 'uq_social_behavior_analysis_contact_id'),
      ('whatsapp_messages', 'message_id', 'uq_whatsapp_messages_message_id')
    ) AS constraints(table_name, column_name, constraint_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', constraint_definition.table_name))
        AND attname = constraint_definition.column_name
        AND NOT attisdropped
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = to_regclass(format('public.%I', constraint_definition.table_name))
        AND conname = constraint_definition.constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (%I)',
        constraint_definition.table_name,
        constraint_definition.constraint_name,
        constraint_definition.column_name
      );
    END IF;
  END LOOP;
END;
$migration$;
