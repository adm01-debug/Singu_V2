-- Migration: drop_redundant_permissive_policies (Wave 122)
-- Eliminates "multiple_permissive_policies" advisor warnings by dropping
-- policies that are made redundant by a broader ALL-command policy on the
-- same table with identical USING/WITH CHECK expressions, or by BYPASSRLS.
--
-- Three fix categories:
--
-- 1. public schema: SELECT-specific policies whose qual duplicates the ALL policy.
--    DROP the SELECT policy; the ALL policy already covers reads.
--
-- 2. zapp_history schema: ALL policies with qual=(auth.role()='service_role').
--    service_role has rolbypassrls=true, so these are dead code — same fix
--    as Wave 120 in the public schema.
--
-- 3. _dormant schema: SELECT policies whose qual is identical to the ALL policy.

DO $migration$
DECLARE
  policy_definition record;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('public', 'clients', 'clients_select'),
      ('public', 'sales_tasks', 'mcp_tasks_read'),
      ('public', 'workspace_accounts', 'workspace_accounts_read'),
      ('zapp_history', 'admin_grants', 'ag_service_all'),
      ('zapp_history', 'ai_cost_log', 'acl_service_all'),
      ('zapp_history', 'ai_training_dataset', 'atd_service_all'),
      ('zapp_history', 'async_request_log', 'arl_service_all'),
      ('zapp_history', 'conversation_daily_summaries', 'cds_service_all'),
      ('zapp_history', 'conversations', 'conv_service_all'),
      ('zapp_history', 'message_audio', 'ma_service_all'),
      ('zapp_history', 'message_embeddings', 'me_service_all'),
      ('zapp_history', 'message_links', 'ml_service_all'),
      ('zapp_history', 'message_media', 'mm_service_all'),
      ('zapp_history', 'messages', 'msg_service_all'),
      ('zapp_history', 'runtime_config', 'rc_service_all'),
      ('zapp_history', 'whatsapp_connections', 'wc_service_all'),
      ('zapp_history', 'disc_playbook', 'admin_write_playbook'),
      ('zapp_history', 'edge_function_templates', 'eft_service_all'),
      ('zapp_history', 'location_dictionary', 'admin_write_location'),
      ('zapp_history', 'product_dictionary', 'admin_write_products'),
      ('_dormant', 'disc_conversion_metrics', 'Users can view their own DISC conversion metrics'),
      ('_dormant', 'team_closers', 'team_closers_select'),
      ('_dormant', 'teams', 'teams_select')
    ) AS policies(schema_name, table_name, policy_name)
  LOOP
    IF to_regclass(format('%I.%I', policy_definition.schema_name, policy_definition.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I',
        policy_definition.policy_name,
        policy_definition.schema_name,
        policy_definition.table_name
      );
    END IF;
  END LOOP;
END;
$migration$;
