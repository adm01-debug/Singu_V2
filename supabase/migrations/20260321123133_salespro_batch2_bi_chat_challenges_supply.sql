-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321123133
-- nome:   salespro_batch2_bi_chat_challenges_supply

CREATE TABLE IF NOT EXISTS public.client_portfolio (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')), last_purchase_date DATE, assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), assigned_by UUID REFERENCES public.salespeople(id), source TEXT DEFAULT 'database', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(client_id, salesperson_id));

CREATE TABLE IF NOT EXISTS public.portfolio_settings (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, setting_key TEXT NOT NULL UNIQUE, setting_value TEXT NOT NULL, description TEXT, updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.bitrix24_sync_logs (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sync_type TEXT NOT NULL DEFAULT 'sync-all', status TEXT NOT NULL DEFAULT 'success', companies_from_bitrix INTEGER DEFAULT 0, companies_to_bitrix INTEGER DEFAULT 0, deals_from_bitrix INTEGER DEFAULT 0, deals_to_bitrix INTEGER DEFAULT 0, error_message TEXT, duration_ms INTEGER, triggered_by TEXT DEFAULT 'manual', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sdr_alert_history (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), triggered_by TEXT DEFAULT 'cron', sdrs_notified INTEGER NOT NULL DEFAULT 0, threshold_used INTEGER NOT NULL DEFAULT 3, sdr_details JSONB NOT NULL DEFAULT '[]'::jsonb, admin_emails TEXT[] NOT NULL DEFAULT '{}'::text[]);

CREATE TABLE IF NOT EXISTS public.email_logs (id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, function_name text NOT NULL, recipient_email text NOT NULL, subject text, status text NOT NULL DEFAULT 'sent', error_message text, metadata jsonb DEFAULT '{}'::jsonb, created_at timestamp with time zone NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.chat_conversations (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, title TEXT NOT NULL DEFAULT 'Nova conversa', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.chat_messages (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK (role IN ('user', 'assistant')), content TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.weekly_challenges (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, description TEXT, challenge_type TEXT NOT NULL DEFAULT 'activity', target_value INTEGER NOT NULL DEFAULT 10, xp_reward INTEGER NOT NULL DEFAULT 100, start_date DATE NOT NULL, end_date DATE NOT NULL, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.challenge_progress (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, current_value INTEGER NOT NULL DEFAULT 0, completed_at TIMESTAMP WITH TIME ZONE, xp_claimed BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(challenge_id, salesperson_id));

CREATE TABLE IF NOT EXISTS public.daily_challenges (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, description TEXT, challenge_type TEXT NOT NULL DEFAULT 'calls', target_value INTEGER NOT NULL DEFAULT 5, xp_reward INTEGER NOT NULL DEFAULT 25, challenge_date DATE NOT NULL DEFAULT CURRENT_DATE, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.daily_challenge_progress (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, current_value INTEGER NOT NULL DEFAULT 0, completed_at TIMESTAMP WITH TIME ZONE, xp_claimed BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(challenge_id, salesperson_id));

CREATE TABLE IF NOT EXISTS public.daily_streak_achievements (id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id uuid NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, streak_type text NOT NULL, achieved_at timestamp with time zone NOT NULL DEFAULT now(), streak_count integer NOT NULL, xp_awarded integer NOT NULL DEFAULT 0, created_at timestamp with time zone NOT NULL DEFAULT now(), UNIQUE(salesperson_id, streak_type));

CREATE TABLE IF NOT EXISTS public.push_subscriptions (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, endpoint TEXT NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(user_id));

CREATE TABLE IF NOT EXISTS public.demand_forecasts (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, forecast_date DATE NOT NULL, predicted_quantity INTEGER NOT NULL DEFAULT 0, predicted_revenue NUMERIC(12,2) NOT NULL DEFAULT 0, confidence_score NUMERIC(5,2) DEFAULT 0.80, factors JSONB DEFAULT '{}', model_version TEXT DEFAULT 'v1', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.inventory_levels (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES public.products(id) ON DELETE CASCADE UNIQUE, current_stock INTEGER NOT NULL DEFAULT 0, min_stock_level INTEGER NOT NULL DEFAULT 10, max_stock_level INTEGER NOT NULL DEFAULT 100, reorder_point INTEGER NOT NULL DEFAULT 20, lead_time_days INTEGER DEFAULT 7, last_restock_date TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.stock_movements (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')), quantity INTEGER NOT NULL, reason TEXT, reference_id UUID, performed_by UUID, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
