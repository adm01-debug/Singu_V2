-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321125138
-- nome:   cleanup_drop_salespro_shell_tables_batch1

-- CLEANUP: Drop 107 empty shell tables created incorrectly
-- These have incomplete schemas (missing columns, indexes, triggers, policies)
-- Will be recreated via full sequential migrations

DROP TABLE IF EXISTS public.territory_history CASCADE;
DROP TABLE IF EXISTS public.sales_territories CASCADE;
DROP TABLE IF EXISTS public.performance_bets CASCADE;
DROP TABLE IF EXISTS public.tournament_matches CASCADE;
DROP TABLE IF EXISTS public.tournament_participants CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.kudos CASCADE;
DROP TABLE IF EXISTS public.competitive_chat_messages CASCADE;
DROP TABLE IF EXISTS public.progressive_goals CASCADE;
DROP TABLE IF EXISTS public.salesperson_badges CASCADE;
DROP TABLE IF EXISTS public.collectible_badges CASCADE;
DROP TABLE IF EXISTS public.available_spins CASCADE;
DROP TABLE IF EXISTS public.prize_wheel_spins CASCADE;
DROP TABLE IF EXISTS public.weekly_matchups CASCADE;
DROP TABLE IF EXISTS public.sales_streaks CASCADE;
DROP TABLE IF EXISTS public.salesperson_leagues CASCADE;
DROP TABLE IF EXISTS public.rank_change_notifications CASCADE;
DROP TABLE IF EXISTS public.active_power_ups CASCADE;
DROP TABLE IF EXISTS public.competitive_seasons CASCADE;
DROP TABLE IF EXISTS public.battle_participants CASCADE;
DROP TABLE IF EXISTS public.sales_battles CASCADE;
DROP TABLE IF EXISTS public.feed_comments CASCADE;
DROP TABLE IF EXISTS public.feed_reactions CASCADE;
DROP TABLE IF EXISTS public.victory_feed CASCADE;
DROP TABLE IF EXISTS public.dashboard_layouts CASCADE;
DROP TABLE IF EXISTS public.email_tracking_events CASCADE;
DROP TABLE IF EXISTS public.workflow_rules CASCADE;
DROP TABLE IF EXISTS public.quote_sync_logs CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.salesperson_preferences CASCADE;
DROP TABLE IF EXISTS public.password_reset_requests CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.webauthn_challenges CASCADE;
DROP TABLE IF EXISTS public.webauthn_credentials CASCADE;
