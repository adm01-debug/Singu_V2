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

-- ── public ───────────────────────────────────────────────────────────────────
-- clients: clients_select (SELECT) duplicates clients_all (ALL), same qual
DROP POLICY IF EXISTS clients_select ON public.clients;

-- sales_tasks: mcp_tasks_read (SELECT) duplicates sales_tasks_all (ALL), same qual
DROP POLICY IF EXISTS mcp_tasks_read ON public.sales_tasks;

-- workspace_accounts: workspace_accounts_read (SELECT) duplicates workspace_accounts_write (ALL)
DROP POLICY IF EXISTS workspace_accounts_read ON public.workspace_accounts;

-- ── zapp_history — auth.role()='service_role' ALL policies (BYPASSRLS makes them dead code)
DROP POLICY IF EXISTS ag_service_all  ON zapp_history.admin_grants;
DROP POLICY IF EXISTS acl_service_all ON zapp_history.ai_cost_log;
DROP POLICY IF EXISTS atd_service_all ON zapp_history.ai_training_dataset;
DROP POLICY IF EXISTS arl_service_all ON zapp_history.async_request_log;
DROP POLICY IF EXISTS cds_service_all ON zapp_history.conversation_daily_summaries;
DROP POLICY IF EXISTS conv_service_all ON zapp_history.conversations;
DROP POLICY IF EXISTS ma_service_all  ON zapp_history.message_audio;
DROP POLICY IF EXISTS me_service_all  ON zapp_history.message_embeddings;
DROP POLICY IF EXISTS ml_service_all  ON zapp_history.message_links;
DROP POLICY IF EXISTS mm_service_all  ON zapp_history.message_media;
DROP POLICY IF EXISTS msg_service_all ON zapp_history.messages;
DROP POLICY IF EXISTS rc_service_all  ON zapp_history.runtime_config;
DROP POLICY IF EXISTS wc_service_all  ON zapp_history.whatsapp_connections;

-- Also drop service_role-scoped ALL policies (roles={service_role}, qual=true) —
-- same as Wave 120 pattern, BYPASSRLS makes them redundant
DROP POLICY IF EXISTS admin_write_playbook  ON zapp_history.disc_playbook;
DROP POLICY IF EXISTS eft_service_all       ON zapp_history.edge_function_templates;
DROP POLICY IF EXISTS admin_write_location  ON zapp_history.location_dictionary;
DROP POLICY IF EXISTS admin_write_products  ON zapp_history.product_dictionary;

-- ── _dormant ─────────────────────────────────────────────────────────────────
-- disc_conversion_metrics: "Users can view..." SELECT qual = "Users can manage..." ALL qual
DROP POLICY IF EXISTS "Users can view their own DISC conversion metrics" ON _dormant.disc_conversion_metrics;

-- team_closers: team_closers_select qual = team_closers_all qual (both true)
DROP POLICY IF EXISTS team_closers_select ON _dormant.team_closers;

-- teams: teams_select qual = teams_all qual (both true)
DROP POLICY IF EXISTS teams_select ON _dormant.teams;
