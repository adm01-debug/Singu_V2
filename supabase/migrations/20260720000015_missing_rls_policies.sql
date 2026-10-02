-- Migration: Add missing RLS policies for 11 business tables queried from the frontend
--
-- These tables have RLS ENABLED but zero policies, meaning all client-side queries
-- (using the anon/user JWT) silently return 0 rows. They are correctly accessible
-- from edge functions (service role bypasses RLS), but the frontend direct queries
-- are blocked. This migration adds owner-scoped policies so the frontend works
-- correctly while maintaining row-level isolation between users.

DO $migration$
DECLARE
  policy_definition record;
  ddl text;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('favorite_templates', 'Users manage own favorite_templates', 'ALL', true, true),
      ('intent_scores', 'Users view own intent_scores', 'SELECT', true, false),
      ('intent_scores', 'Users manage own intent_scores', 'INSERT', false, true),
      ('intent_scores', 'Users update own intent_scores', 'UPDATE', true, true),
      ('intent_scores', 'Users delete own intent_scores', 'DELETE', true, false),
      ('intent_signals', 'Users view own intent_signals', 'SELECT', true, false),
      ('intent_signals', 'Users insert own intent_signals', 'INSERT', false, true),
      ('intent_signals', 'Users update own intent_signals', 'UPDATE', true, true),
      ('intent_signals', 'Users delete own intent_signals', 'DELETE', true, false),
      ('battle_cards', 'Users manage own battle_cards', 'ALL', true, true),
      ('competitors', 'Users manage own competitors', 'ALL', true, true),
      ('rfm_metrics', 'Users view own rfm_metrics', 'SELECT', true, false),
      ('rfm_metrics', 'Users manage own rfm_metrics', 'INSERT', false, true),
      ('rfm_metrics', 'Users update own rfm_metrics', 'UPDATE', true, true),
      ('rfm_metrics', 'Users delete own rfm_metrics', 'DELETE', true, false),
      ('rfm_history', 'Users view own rfm_history', 'SELECT', true, false),
      ('rfm_history', 'Users insert own rfm_history', 'INSERT', false, true),
      ('win_loss_records', 'Users manage own win_loss_records', 'ALL', true, true),
      ('win_loss_reasons', 'Users manage own win_loss_reasons', 'ALL', true, true),
      ('sequence_enrollments', 'Users view own sequence_enrollments', 'SELECT', true, false),
      ('sequence_enrollments', 'Users insert own sequence_enrollments', 'INSERT', false, true),
      ('sequence_enrollments', 'Users update own sequence_enrollments', 'UPDATE', true, true),
      ('sequence_enrollments', 'Users delete own sequence_enrollments', 'DELETE', true, false)
    ) AS policies(table_name, policy_name, action, has_using, has_check)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', policy_definition.table_name))
        AND attname = 'user_id'
        AND NOT attisdropped
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_policy
      WHERE polrelid = to_regclass(format('public.%I', policy_definition.table_name))
        AND polname = policy_definition.policy_name
    ) THEN
      ddl := format(
        'CREATE POLICY %I ON public.%I FOR %s',
        policy_definition.policy_name,
        policy_definition.table_name,
        policy_definition.action
      );

      IF policy_definition.has_using THEN
        ddl := ddl || ' USING (user_id = auth.uid())';
      END IF;
      IF policy_definition.has_check THEN
        ddl := ddl || ' WITH CHECK (user_id = auth.uid())';
      END IF;

      EXECUTE ddl;
    END IF;
  END LOOP;
END;
$migration$;

DO $migration$
DECLARE
  policy_definition record;
  predicate constant text :=
    'EXISTS (
      SELECT 1
      FROM public.sms_campaigns sc
      WHERE sc.id = sms_campaign_recipients.campaign_id
        AND sc.user_id = auth.uid()
    )';
  ddl text;
BEGIN
  IF (
    SELECT count(*) = 1
    FROM pg_attribute
    WHERE attrelid = to_regclass('public.sms_campaign_recipients')
      AND attname = 'campaign_id'
      AND NOT attisdropped
  ) AND (
    SELECT count(*) = 2
    FROM pg_attribute
    WHERE attrelid = to_regclass('public.sms_campaigns')
      AND attname = ANY(ARRAY['id', 'user_id'])
      AND NOT attisdropped
  ) THEN
    FOR policy_definition IN
      SELECT *
      FROM (VALUES
        ('Users view own campaign recipients', 'SELECT', true, false),
        ('Users insert own campaign recipients', 'INSERT', false, true),
        ('Users update own campaign recipients', 'UPDATE', true, false),
        ('Users delete own campaign recipients', 'DELETE', true, false)
      ) AS policies(policy_name, action, has_using, has_check)
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = 'public.sms_campaign_recipients'::regclass
          AND polname = policy_definition.policy_name
      ) THEN
        ddl := format(
          'CREATE POLICY %I ON public.sms_campaign_recipients FOR %s',
          policy_definition.policy_name,
          policy_definition.action
        );

        IF policy_definition.has_using THEN
          ddl := ddl || format(' USING (%s)', predicate);
        END IF;
        IF policy_definition.has_check THEN
          ddl := ddl || format(' WITH CHECK (%s)', predicate);
        END IF;

        EXECUTE ddl;
      END IF;
    END LOOP;
  END IF;
END;
$migration$;
