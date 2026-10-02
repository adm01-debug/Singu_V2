-- Migration: DEFAULT false + NOT NULL on nullable boolean columns in base tables
-- Prevents 3-value logic bugs (WHERE col = true misses NULL rows in Postgres).
-- All verified to have zero NULL rows in live data.
-- Excluded:
--   custom_field_values.value_boolean — intentionally nullable (optional field value)
--   lead_assignments.sla_met — NULL = "not yet assessed", semantically distinct from false
--   trigger_intensity_history.is_escalation, reached_max_intensity — GENERATED columns

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = to_regclass('public.interactions')
      AND attname = 'follow_up_required'
      AND NOT attisdropped
  ) THEN
    ALTER TABLE public.interactions
      ALTER COLUMN follow_up_required SET DEFAULT false,
      ALTER COLUMN follow_up_required SET NOT NULL;
  END IF;
END;
$migration$;
