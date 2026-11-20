-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321123300
-- nome:   salespro_batch3b_gamification_competitive

CREATE TABLE IF NOT EXISTS public.sales_battles (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, description TEXT, start_date DATE NOT NULL, end_date DATE NOT NULL, metric TEXT NOT NULL DEFAULT 'revenue', status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')), xp_reward INTEGER NOT NULL DEFAULT 200, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.battle_participants (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, battle_id UUID NOT NULL REFERENCES public.sales_battles(id) ON DELETE CASCADE, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, current_score NUMERIC(12,2) NOT NULL DEFAULT 0, rank INTEGER, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(battle_id, salesperson_id));

CREATE TABLE IF NOT EXISTS public.competitive_seasons (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')), prize_description TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.active_power_ups (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, power_up_type TEXT NOT NULL, multiplier NUMERIC(3,2) NOT NULL DEFAULT 2.0, activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), expires_at TIMESTAMP WITH TIME ZONE NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true);

CREATE TABLE IF NOT EXISTS public.rank_change_notifications (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, old_rank INTEGER NOT NULL, new_rank INTEGER NOT NULL, change_type TEXT NOT NULL CHECK (change_type IN ('up', 'down')), is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.salesperson_leagues (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, league TEXT NOT NULL DEFAULT 'bronze' CHECK (league IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')), season_id UUID REFERENCES public.competitive_seasons(id), promoted_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sales_streaks (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, streak_type TEXT NOT NULL DEFAULT 'daily_sales', current_streak INTEGER NOT NULL DEFAULT 0, best_streak INTEGER NOT NULL DEFAULT 0, last_activity_date DATE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(salesperson_id, streak_type));

CREATE TABLE IF NOT EXISTS public.weekly_matchups (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, player1_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, player2_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, week_start DATE NOT NULL, week_end DATE NOT NULL, player1_score NUMERIC(12,2) NOT NULL DEFAULT 0, player2_score NUMERIC(12,2) NOT NULL DEFAULT 0, winner_id UUID REFERENCES public.salespeople(id), status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.prize_wheel_spins (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, prize_type TEXT NOT NULL, prize_value TEXT NOT NULL, xp_bonus INTEGER DEFAULT 0, spun_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.available_spins (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, spins_available INTEGER NOT NULL DEFAULT 0, last_earned_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(salesperson_id));

CREATE TABLE IF NOT EXISTS public.collectible_badges (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT, icon TEXT NOT NULL DEFAULT 'trophy', category TEXT NOT NULL DEFAULT 'achievement', rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')), requirement_type TEXT NOT NULL, requirement_value INTEGER NOT NULL DEFAULT 1, xp_reward INTEGER NOT NULL DEFAULT 50, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.salesperson_badges (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, badge_id UUID NOT NULL REFERENCES public.collectible_badges(id) ON DELETE CASCADE, earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), is_displayed BOOLEAN NOT NULL DEFAULT true, UNIQUE(salesperson_id, badge_id));

CREATE TABLE IF NOT EXISTS public.progressive_goals (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, goal_type TEXT NOT NULL, current_tier INTEGER NOT NULL DEFAULT 1, current_value NUMERIC NOT NULL DEFAULT 0, tier_target NUMERIC NOT NULL, completed_tiers JSONB DEFAULT '[]'::jsonb, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(salesperson_id, goal_type));

CREATE TABLE IF NOT EXISTS public.competitive_chat_messages (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, message TEXT NOT NULL, message_type TEXT NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'taunt', 'celebration', 'system')), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.kudos (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, from_salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, to_salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, message TEXT NOT NULL, category TEXT DEFAULT 'general', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
