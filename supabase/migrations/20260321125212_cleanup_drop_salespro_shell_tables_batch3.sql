-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321125212
-- nome:   cleanup_drop_salespro_shell_tables_batch3

DROP TABLE IF EXISTS public.portfolio_settings CASCADE;
DROP TABLE IF EXISTS public.client_portfolio CASCADE;
DROP TABLE IF EXISTS public.icp_data CASCADE;
DROP TABLE IF EXISTS public.xp_history CASCADE;
DROP TABLE IF EXISTS public.salesperson_xp CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.activity_goals CASCADE;
DROP TABLE IF EXISTS public.cadence_tasks CASCADE;
DROP TABLE IF EXISTS public.prospect_cadences CASCADE;
DROP TABLE IF EXISTS public.cadence_steps CASCADE;
DROP TABLE IF EXISTS public.cadences CASCADE;
DROP TABLE IF EXISTS public.lead_routing_log CASCADE;
DROP TABLE IF EXISTS public.lead_scores CASCADE;
DROP TABLE IF EXISTS public.playbook_progress CASCADE;
DROP TABLE IF EXISTS public.playbook_items CASCADE;
DROP TABLE IF EXISTS public.playbooks CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.objections_library CASCADE;
DROP TABLE IF EXISTS public.deal_chat_history CASCADE;
DROP TABLE IF EXISTS public.deal_stage_history CASCADE;
DROP TABLE IF EXISTS public.deal_outcomes CASCADE;
DROP TABLE IF EXISTS public.entity_versions CASCADE;
DROP TABLE IF EXISTS public.saved_filters CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.team_closers CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.category_metrics CASCADE;
DROP TABLE IF EXISTS public.daily_metrics CASCADE;
DROP TABLE IF EXISTS public.sales_goals CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.salespeople CASCADE;
DROP TABLE IF EXISTS public.circuit_breaker_events CASCADE;
DROP TABLE IF EXISTS public.security_alert_history CASCADE;
DROP TABLE IF EXISTS public.security_alert_settings CASCADE;
DROP TABLE IF EXISTS public.access_denied_logs CASCADE;
