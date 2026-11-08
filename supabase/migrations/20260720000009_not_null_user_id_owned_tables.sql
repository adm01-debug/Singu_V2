-- Migration: NOT NULL on user_id for user-owned tables
-- Prevents orphaned rows (invisible to RLS where auth.uid() = user_id never matches NULL).
--
-- Part 1: 22 tables already had zero NULL rows — constraint added directly.
-- Part 2: 3 analytics tables had NULL user_ids set by background jobs;
--         backfilled via contact_id → contacts.user_id, then constrained.
-- Excluded: interaction_templates — is_public=true rows are system seed
--           templates intentionally without a per-user owner.

-- ============================================================
-- PART 1 — Tables with zero NULL user_id rows (safe direct constraint)
-- ============================================================

DO $migration$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT unnest(ARRAY[
      'activity_feed',
      'cadence_enrollments',
      'commissions',
      'company_cadences',
      'deals',
      'documents',
      'favorites',
      'meetings',
      'notifications',
      'proposals',
      'quick_notes',
      'reminders',
      'sales_forecasts',
      'sales_goals',
      'scheduled_visits',
      'seller_daily_metrics',
      'sla_violations',
      'tasks',
      'territory_assignments',
      'user_badges',
      'user_goals'
    ])
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', table_name))
        AND attname = 'user_id'
        AND NOT attisdropped
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL',
        table_name
      );
    END IF;
  END LOOP;
END;
$migration$;

-- ============================================================
-- PART 2 — Analytics tables: backfill via contact owner, then constrain
-- ============================================================

DO $migration$
DECLARE
  table_name text;
BEGIN
  IF to_regclass('public.contacts') IS NULL THEN
    RETURN;
  END IF;

  FOR table_name IN
    SELECT unnest(ARRAY[
      'relationship_score_history',
      'churn_predictions',
      'deal_velocity_analysis'
    ])
  LOOP
    IF (
      SELECT count(*) = 2
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', table_name))
        AND attname = ANY(ARRAY['contact_id', 'user_id'])
        AND NOT attisdropped
    ) THEN
      EXECUTE format(
        'UPDATE public.%I target
         SET user_id = contacts.user_id
         FROM public.contacts contacts
         WHERE target.contact_id = contacts.id
           AND target.user_id IS NULL',
        table_name
      );
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL',
        table_name
      );
    END IF;
  END LOOP;
END;
$migration$;
