-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721191509
-- nome:   drop_redundant_permissive_policies

-- ── public ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS clients_select ON public.clients;
DROP POLICY IF EXISTS mcp_tasks_read ON public.sales_tasks;
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

DROP POLICY IF EXISTS admin_write_playbook  ON zapp_history.disc_playbook;
DROP POLICY IF EXISTS eft_service_all       ON zapp_history.edge_function_templates;
DROP POLICY IF EXISTS admin_write_location  ON zapp_history.location_dictionary;
DROP POLICY IF EXISTS admin_write_products  ON zapp_history.product_dictionary;

-- ── _dormant ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own DISC conversion metrics" ON _dormant.disc_conversion_metrics;
DROP POLICY IF EXISTS team_closers_select ON _dormant.team_closers;
DROP POLICY IF EXISTS teams_select ON _dormant.teams;
