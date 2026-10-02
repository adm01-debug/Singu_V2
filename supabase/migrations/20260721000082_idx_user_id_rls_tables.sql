-- Migration: idx_user_id_rls_tables (Wave 168)
-- PERFORMANCE FIX: 54 tables have RLS policies that filter on user_id but
-- have no index on that column. Every authenticated REST API query against
-- these tables causes a sequential scan — catastrophic at scale.
--
-- All 45 tables that already had user_id indexes were confirmed clean.
-- This wave adds the 54 missing indexes.
--
-- Index naming: idx_{table}_user_id

DO $migration$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ai_chat_messages',
    'ai_chat_threads',
    'automation_logs',
    'calendar_events',
    'campaign_recipients',
    'churn_risk_scores',
    'city_whitelist',
    'cognitive_bias_history',
    'compatibility_alerts',
    'contact_notes',
    'contact_relatives',
    'csat_surveys',
    'custom_field_values',
    'decision_criteria',
    'device_login_notifications',
    'disc_analysis_history',
    'disc_communication_logs',
    'document_signatures',
    'document_templates',
    'document_views',
    'email_campaigns',
    'emotional_anchors',
    'emotional_states_history',
    'eq_analysis_history',
    'handoff_requests',
    'health_alerts',
    'insights',
    'ip_whitelist',
    'landing_page_submissions',
    'lead_assignments',
    'lead_routing_rules',
    'lead_score_history',
    'life_events',
    'meeting_summaries',
    'metaprogram_analysis',
    'nurturing_enrollments',
    'nurturing_workflows',
    'offer_suggestions',
    'purchase_history',
    'redistribution_log',
    'sequence_enrollments',
    'sequence_steps',
    'sequences',
    'sms_campaign_recipients',
    'sms_campaigns',
    'sms_templates',
    'support_tickets',
    'ticket_comments',
    'trigger_intensity_history',
    'vak_analysis_history',
    'visit_checkins',
    'webauthn_credentials',
    'whatsapp_messages'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', table_name))
        AND attname = 'user_id'
        AND NOT attisdropped
    ) THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (user_id)',
        'idx_' || table_name || '_user_id',
        table_name
      );
    END IF;
  END LOOP;
END;
$migration$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  missing_count int;
BEGIN
  WITH rls_tables AS (
    SELECT DISTINCT cl.relname AS tablename
    FROM pg_class cl
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
    JOIN pg_policy pol ON pol.polrelid = cl.oid
    WHERE (
      pg_get_expr(pol.polqual, pol.polrelid) LIKE '%user_id%'
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%user_id%'
    )
  ),
  indexed AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE a.attname = 'user_id'
  )
  SELECT COUNT(*) INTO missing_count
  FROM rls_tables rt
  LEFT JOIN indexed i ON i.tablename = rt.tablename
  WHERE i.tablename IS NULL;

  IF missing_count = 0 THEN
    RAISE NOTICE '[Wave 168] All RLS user_id-filtered tables now have user_id indexes. Performance clean.';
  ELSE
    RAISE WARNING '[Wave 168] % tables still missing user_id index after migration', missing_count;
  END IF;
END;
$$;
