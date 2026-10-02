-- Migration: composite UNIQUE constraints on enrollment/junction tables
-- Prevents the same entity being enrolled/added twice to the same campaign,
-- workflow, or having duplicate social profiles per platform.
-- All tables verified to have zero duplicate rows before applying.

DO $migration$
DECLARE
  unique_definition record;
BEGIN
  FOR unique_definition IN
    SELECT *
    FROM (VALUES
      ('campaign_members', ARRAY['campaign_id', 'contact_id'], 'uq_campaign_members_campaign_contact', 'CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_members_campaign_contact ON public.campaign_members(campaign_id, contact_id) WHERE contact_id IS NOT NULL'),
      ('campaign_recipients', ARRAY['campaign_id', 'email'], 'uq_campaign_recipients_campaign_email', 'ALTER TABLE public.campaign_recipients ADD CONSTRAINT uq_campaign_recipients_campaign_email UNIQUE (campaign_id, email)'),
      ('sms_campaign_recipients', ARRAY['campaign_id', 'phone_number'], 'uq_sms_campaign_recipients_campaign_phone', 'ALTER TABLE public.sms_campaign_recipients ADD CONSTRAINT uq_sms_campaign_recipients_campaign_phone UNIQUE (campaign_id, phone_number)'),
      ('nurturing_enrollments', ARRAY['workflow_id', 'contact_id'], 'uq_nurturing_enrollments_workflow_contact', 'ALTER TABLE public.nurturing_enrollments ADD CONSTRAINT uq_nurturing_enrollments_workflow_contact UNIQUE (workflow_id, contact_id)'),
      ('social_profiles', ARRAY['contact_id', 'platform'], 'uq_social_profiles_contact_platform', 'ALTER TABLE public.social_profiles ADD CONSTRAINT uq_social_profiles_contact_platform UNIQUE (contact_id, platform)')
    ) AS definitions(table_name, column_names, object_name, ddl)
  LOOP
    IF (
      SELECT count(*) = cardinality(unique_definition.column_names)
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', unique_definition.table_name))
        AND attname = ANY(unique_definition.column_names)
        AND NOT attisdropped
    ) AND to_regclass(format('public.%I', unique_definition.object_name)) IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = to_regclass(format('public.%I', unique_definition.table_name))
          AND conname = unique_definition.object_name
      )
    THEN
      EXECUTE unique_definition.ddl;
    END IF;
  END LOOP;
END;
$migration$;
