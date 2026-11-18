-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321123327
-- nome:   salespro_batch4_tournaments_territories_final

CREATE TABLE IF NOT EXISTS public.tournaments (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, description TEXT, tournament_type TEXT NOT NULL DEFAULT 'bracket' CHECK (tournament_type IN ('bracket', 'round_robin', 'swiss')), status TEXT NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'active', 'completed', 'cancelled')), metric TEXT NOT NULL DEFAULT 'revenue', start_date DATE NOT NULL, end_date DATE NOT NULL, max_participants INTEGER DEFAULT 16, xp_reward_winner INTEGER DEFAULT 500, xp_reward_runner_up INTEGER DEFAULT 250, xp_reward_participant INTEGER DEFAULT 50, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.tournament_participants (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, seed INTEGER, final_rank INTEGER, total_score NUMERIC(12,2) DEFAULT 0, status TEXT DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'winner', 'runner_up')), joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(tournament_id, salesperson_id));

CREATE TABLE IF NOT EXISTS public.tournament_matches (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE, round INTEGER NOT NULL, match_number INTEGER NOT NULL, player1_id UUID REFERENCES public.salespeople(id), player2_id UUID REFERENCES public.salespeople(id), player1_score NUMERIC(12,2) DEFAULT 0, player2_score NUMERIC(12,2) DEFAULT 0, winner_id UUID REFERENCES public.salespeople(id), status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')), scheduled_start DATE, scheduled_end DATE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.performance_bets (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, bettor_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, target_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, bet_type TEXT NOT NULL DEFAULT 'will_hit_goal', xp_wagered INTEGER NOT NULL DEFAULT 50, xp_potential_win INTEGER NOT NULL DEFAULT 100, status TEXT DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost', 'cancelled')), resolution_date DATE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sales_territories (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, description TEXT, region TEXT, salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL, client_count INTEGER DEFAULT 0, total_revenue NUMERIC(12,2) DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.territory_history (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, territory_id UUID NOT NULL REFERENCES public.sales_territories(id) ON DELETE CASCADE, from_salesperson_id UUID REFERENCES public.salespeople(id), to_salesperson_id UUID REFERENCES public.salespeople(id), reason TEXT, transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.access_denied_logs (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, user_email TEXT, attempted_path TEXT NOT NULL, required_role TEXT, user_role TEXT, ip_address TEXT, user_agent TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.security_alert_settings (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE, notify_new_device BOOLEAN NOT NULL DEFAULT true, notify_failed_login BOOLEAN NOT NULL DEFAULT true, notify_password_change BOOLEAN NOT NULL DEFAULT true, notify_role_change BOOLEAN NOT NULL DEFAULT true, max_failed_attempts INTEGER NOT NULL DEFAULT 5, alert_cooldown_minutes INTEGER NOT NULL DEFAULT 30, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.security_alert_history (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, alert_type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')), details JSONB DEFAULT '{}', ip_address TEXT, is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.circuit_breaker_events (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, circuit_name TEXT NOT NULL, event_type TEXT NOT NULL CHECK (event_type IN ('opened', 'closed', 'half_open')), failure_count INTEGER DEFAULT 0, last_failure_reason TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.migration_log (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, migration_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'completed', details JSONB DEFAULT '{}', executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
