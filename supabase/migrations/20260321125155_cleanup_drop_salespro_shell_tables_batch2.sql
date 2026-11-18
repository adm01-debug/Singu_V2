-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321125155
-- nome:   cleanup_drop_salespro_shell_tables_batch2

DROP TABLE IF EXISTS public.login_alerts CASCADE;
DROP TABLE IF EXISTS public.known_devices CASCADE;
DROP TABLE IF EXISTS public.reauthentication_requests CASCADE;
DROP TABLE IF EXISTS public.sms_verification_codes CASCADE;
DROP TABLE IF EXISTS public.mfa_verification_attempts CASCADE;
DROP TABLE IF EXISTS public.user_mfa_settings CASCADE;
DROP TABLE IF EXISTS public.active_sessions CASCADE;
DROP TABLE IF EXISTS public.rate_limit_settings CASCADE;
DROP TABLE IF EXISTS public.ip_whitelist CASCADE;
DROP TABLE IF EXISTS public.blocked_ips CASCADE;
DROP TABLE IF EXISTS public.rate_limit_logs CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;
DROP TABLE IF EXISTS public.migration_log CASCADE;
DROP TABLE IF EXISTS public.price_alerts CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.document_signers CASCADE;
DROP TABLE IF EXISTS public.digital_signatures CASCADE;
DROP TABLE IF EXISTS public.supplier_risk_assessments CASCADE;
DROP TABLE IF EXISTS public.supplier_order_items CASCADE;
DROP TABLE IF EXISTS public.supplier_orders CASCADE;
DROP TABLE IF EXISTS public.supplier_products CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.inventory_levels CASCADE;
DROP TABLE IF EXISTS public.demand_forecasts CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.daily_streak_achievements CASCADE;
DROP TABLE IF EXISTS public.daily_challenge_progress CASCADE;
DROP TABLE IF EXISTS public.daily_challenges CASCADE;
DROP TABLE IF EXISTS public.challenge_progress CASCADE;
DROP TABLE IF EXISTS public.weekly_challenges CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.sdr_alert_history CASCADE;
DROP TABLE IF EXISTS public.bitrix24_sync_logs CASCADE;
