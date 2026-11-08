-- Wave 178: Index remaining unindexed foreign keys in public schema
-- Covers all FK columns that lacked a covering index after Waves 058/176.
-- Each index uses IF NOT EXISTS so the migration is idempotent.

DO $migration$
DECLARE
  index_definition record;
BEGIN
  FOR index_definition IN
    SELECT *
    FROM (VALUES
      ('cadence_enrollments', 'cadence_id'),
      ('campaign_members', 'campaign_id'),
      ('carrier_evaluations', 'carrier_id'),
      ('carrier_homologations', 'carrier_id'),
      ('carrier_score_history', 'carrier_id'),
      ('company_stakeholder_map', 'company_id'),
      ('custom_field_values', 'custom_field_id'),
      ('deal_competitors', 'deal_id'),
      ('economic_group_members', 'group_id'),
      ('favorites', 'user_id'),
      ('notifications', 'user_id'),
      ('pipeline_stages', 'pipeline_id'),
      ('relationship_score_history', 'contact_id'),
      ('reminders', 'user_id'),
      ('scheduled_visits', 'user_id'),
      ('seller_daily_metrics', 'user_id'),
      ('supplier_evaluations', 'supplier_id'),
      ('supplier_score_history', 'supplier_id'),
      ('tasks', 'user_id'),
      ('territory_assignments', 'territory_id')
    ) AS indexes(table_name, column_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', index_definition.table_name))
        AND attname = index_definition.column_name
        AND NOT attisdropped
    ) THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
        'idx_' || index_definition.table_name || '_' || index_definition.column_name,
        index_definition.table_name,
        index_definition.column_name
      );
    END IF;
  END LOOP;
END;
$migration$;
