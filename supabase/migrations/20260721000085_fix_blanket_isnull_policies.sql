-- Migration: fix_blanket_isnull_policies (Wave 171)
-- Replaces authenticated-only blanket policies with row ownership checks.

DO $migration$
DECLARE
  table_definition record;
  policy_definition record;
  old_policy text;
  owner_predicate text;
  ddl text;
BEGIN
  FOR table_definition IN
    SELECT *
    FROM (VALUES
      ('activity_feed', 'user_id', ARRAY['activity_feed_all']),
      ('cadence_enrollments', 'user_id', ARRAY['cadence_enrollments_all']),
      ('commissions', 'user_id', ARRAY['commissions_all']),
      ('company_cadences', 'user_id', ARRAY['company_cadences_all']),
      ('favorites', 'user_id', ARRAY['favorites_all']),
      ('interaction_templates', 'user_id', ARRAY['interaction_templates_all']),
      ('query_telemetry', 'user_id', ARRAY['query_telemetry_all']),
      ('rfm_history', 'user_id', ARRAY['rfm_history_all']),
      ('rfm_metrics', 'user_id', ARRAY['rfm_metrics_all']),
      ('sales_goals', 'user_id', ARRAY['sales_goals_all']),
      ('scheduled_visits', 'user_id', ARRAY['scheduled_visits_all']),
      ('schema_drift_alerts', 'user_id', ARRAY['schema_drift_all']),
      ('score_history', 'user_id', ARRAY['score_history_all']),
      ('sla_violations', 'user_id', ARRAY['sla_violations_all']),
      ('social_behavior_analysis', 'user_id', ARRAY['social_behavior_all']),
      ('social_life_events', 'user_id', ARRAY['social_life_events_all']),
      ('social_profiles', 'user_id', ARRAY['social_profiles_all']),
      ('social_scraping_schedule', 'user_id', ARRAY['social_scraping_all']),
      ('stakeholder_alerts', 'user_id', ARRAY['stakeholder_alerts_all']),
      ('territory_assignments', 'user_id', ARRAY['territory_assignments_all']),
      ('trigger_ab_tests', 'user_id', ARRAY['trigger_ab_tests_all']),
      ('trigger_channel_effectiveness', 'user_id', ARRAY['trigger_channel_all']),
      ('trigger_usage_history', 'user_id', ARRAY['trigger_usage_all']),
      ('weekly_report_settings', 'user_id', ARRAY['weekly_report_settings_all']),
      ('weekly_reports', 'user_id', ARRAY['weekly_reports_all']),
      ('whatsapp_kpis', 'user_id', ARRAY['whatsapp_kpis_all']),
      ('workspace_accounts', 'id', ARRAY['workspace_accounts_write']),
      ('company_rfm_scores', 'user_id', ARRAY[
        'company_rfm_scores_select',
        'company_rfm_scores_insert',
        'company_rfm_scores_update',
        'company_rfm_scores_delete'
      ]),
      ('company_stakeholder_map', 'user_id', ARRAY[
        'company_stakeholder_map_select',
        'company_stakeholder_map_insert',
        'company_stakeholder_map_update',
        'company_stakeholder_map_delete'
      ]),
      ('relationship_score_history', 'user_id', ARRAY[
        'relationship_score_history_select',
        'relationship_score_history_insert',
        'relationship_score_history_update',
        'relationship_score_history_delete'
      ]),
      ('rfm_segment_config', 'user_id', ARRAY[
        'rfm_segment_config_select',
        'rfm_segment_config_insert',
        'rfm_segment_config_update',
        'rfm_segment_config_delete'
      ]),
      ('trigger_bundles', 'user_id', ARRAY[
        'trigger_bundles_select',
        'trigger_bundles_insert',
        'trigger_bundles_update',
        'trigger_bundles_delete'
      ])
    ) AS tables(table_name, owner_column, old_policies)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', table_definition.table_name))
        AND attname = table_definition.owner_column
        AND NOT attisdropped
    ) THEN
      CONTINUE;
    END IF;

    FOREACH old_policy IN ARRAY table_definition.old_policies
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        old_policy,
        table_definition.table_name
      );
    END LOOP;

    owner_predicate := format(
      '%I = (SELECT auth.uid())',
      table_definition.owner_column
    );

    FOR policy_definition IN
      SELECT *
      FROM (VALUES
        ('select', 'SELECT', true, false),
        ('insert', 'INSERT', false, true),
        ('update', 'UPDATE', true, true),
        ('delete', 'DELETE', true, false)
      ) AS policies(policy_suffix, action, has_using, has_check)
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        table_definition.table_name || '_' || policy_definition.policy_suffix,
        table_definition.table_name
      );

      ddl := format(
        'CREATE POLICY %I ON public.%I FOR %s TO authenticated',
        table_definition.table_name || '_' || policy_definition.policy_suffix,
        table_definition.table_name,
        policy_definition.action
      );

      IF policy_definition.has_using THEN
        ddl := ddl || format(' USING (%s)', owner_predicate);
      END IF;
      IF policy_definition.has_check THEN
        ddl := ddl || format(' WITH CHECK (%s)', owner_predicate);
      END IF;

      EXECUTE ddl;
    END LOOP;
  END LOOP;
END;
$migration$;

DO $verification$
DECLARE
  remaining_isnull_with_userid int;
BEGIN
  WITH isnull_tables AS (
    SELECT DISTINCT cl.relname AS tablename
    FROM pg_policy pol
    JOIN pg_class cl ON pol.polrelid = cl.oid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
    WHERE (
      pg_get_expr(pol.polqual, pol.polrelid) LIKE '%IS NOT NULL%'
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%IS NOT NULL%'
    )
  ),
  user_id_tables AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_attribute a
    JOIN pg_class t ON t.oid = a.attrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    WHERE a.attname = 'user_id' AND a.attnum > 0 AND NOT a.attisdropped
  )
  SELECT COUNT(*) INTO remaining_isnull_with_userid
  FROM isnull_tables i
  JOIN user_id_tables u ON u.tablename = i.tablename;

  IF remaining_isnull_with_userid = 0 THEN
    RAISE NOTICE '[Wave 171] All IS NOT NULL policies on user_id tables replaced with ownership checks. Cross-tenant data leak closed.';
  ELSE
    RAISE WARNING '[Wave 171] % tables still have IS NOT NULL policies with a user_id column', remaining_isnull_with_userid;
  END IF;
END;
$verification$;
