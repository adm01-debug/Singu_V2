-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321123232
-- nome:   salespro_batch3_security_quotes_competitive

CREATE TABLE IF NOT EXISTS public.mfa_verification_attempts (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, method TEXT NOT NULL CHECK (method IN ('totp', 'sms')), success BOOLEAN DEFAULT FALSE, ip_address TEXT, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.sms_verification_codes (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, phone_number TEXT NOT NULL, code TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, used BOOLEAN DEFAULT FALSE, attempts INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.reauthentication_requests (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, action TEXT NOT NULL, status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'expired', 'failed')), ip_address TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ, verified_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS public.known_devices (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, device_fingerprint TEXT NOT NULL, device_name TEXT, browser TEXT, os TEXT, is_trusted BOOLEAN DEFAULT FALSE, first_seen TIMESTAMPTZ DEFAULT NOW(), last_seen TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.login_alerts (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, alert_type TEXT NOT NULL, ip_address TEXT, device_info JSONB DEFAULT '{}', is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.webauthn_credentials (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, credential_id TEXT NOT NULL UNIQUE, public_key TEXT NOT NULL, sign_count INTEGER DEFAULT 0, device_name TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), last_used_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS public.webauthn_challenges (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, challenge TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.password_reset_requests (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, email TEXT NOT NULL, token TEXT NOT NULL UNIQUE, status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')), ip_address TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ, completed_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS public.salesperson_preferences (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE UNIQUE, sound_enabled BOOLEAN NOT NULL DEFAULT true, sound_volume NUMERIC(3,2) NOT NULL DEFAULT 0.7, celebration_sound TEXT DEFAULT 'default', notification_sound TEXT DEFAULT 'default', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.quotes (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, quote_number TEXT NOT NULL UNIQUE, client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')), items JSONB NOT NULL DEFAULT '[]'::jsonb, subtotal NUMERIC(12,2) NOT NULL DEFAULT 0, discount_percent NUMERIC(5,2) DEFAULT 0, discount_amount NUMERIC(12,2) DEFAULT 0, total NUMERIC(12,2) NOT NULL DEFAULT 0, notes TEXT, valid_until DATE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.quote_sync_logs (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE, sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_bitrix', 'from_bitrix')), status TEXT NOT NULL DEFAULT 'pending', bitrix_deal_id TEXT, error_message TEXT, payload JSONB DEFAULT '{}', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.workflow_rules (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, description TEXT, trigger_event TEXT NOT NULL, conditions JSONB NOT NULL DEFAULT '[]'::jsonb, actions JSONB NOT NULL DEFAULT '[]'::jsonb, is_active BOOLEAN NOT NULL DEFAULT true, execution_count INTEGER NOT NULL DEFAULT 0, last_executed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.email_tracking_events (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, email_id UUID REFERENCES public.email_logs(id) ON DELETE CASCADE, event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')), metadata JSONB DEFAULT '{}', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.dashboard_layouts (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, layout_name TEXT NOT NULL DEFAULT 'default', widgets JSONB NOT NULL DEFAULT '[]'::jsonb, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(user_id, layout_name));

CREATE TABLE IF NOT EXISTS public.victory_feed (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, event_type TEXT NOT NULL, title TEXT NOT NULL, description TEXT, xp_earned INTEGER DEFAULT 0, metadata JSONB DEFAULT '{}', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.feed_reactions (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, feed_item_id UUID NOT NULL REFERENCES public.victory_feed(id) ON DELETE CASCADE, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, reaction_type TEXT NOT NULL DEFAULT 'like', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(feed_item_id, salesperson_id));

CREATE TABLE IF NOT EXISTS public.feed_comments (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, feed_item_id UUID NOT NULL REFERENCES public.victory_feed(id) ON DELETE CASCADE, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, content TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
