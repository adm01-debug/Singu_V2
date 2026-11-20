-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321123201
-- nome:   salespro_batch2b_supply_security

CREATE TABLE IF NOT EXISTS public.supplier_products (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE, product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, unit_price NUMERIC(12,2) NOT NULL, min_order_quantity INTEGER DEFAULT 1, currency TEXT DEFAULT 'BRL', last_price_update TIMESTAMP WITH TIME ZONE DEFAULT now(), is_preferred BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(supplier_id, product_id));

CREATE TABLE IF NOT EXISTS public.supplier_orders (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE, order_number TEXT, status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')), total_amount NUMERIC(12,2) NOT NULL DEFAULT 0, order_date TIMESTAMP WITH TIME ZONE DEFAULT now(), expected_delivery TIMESTAMP WITH TIME ZONE, actual_delivery TIMESTAMP WITH TIME ZONE, notes TEXT, created_by UUID, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.supplier_order_items (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, order_id UUID REFERENCES public.supplier_orders(id) ON DELETE CASCADE, product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, quantity INTEGER NOT NULL, unit_price NUMERIC(12,2) NOT NULL, total_price NUMERIC(12,2) NOT NULL, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.supplier_risk_assessments (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE, assessment_date DATE NOT NULL DEFAULT CURRENT_DATE, financial_risk NUMERIC(3,2) DEFAULT 0.5, delivery_risk NUMERIC(3,2) DEFAULT 0.5, quality_risk NUMERIC(3,2) DEFAULT 0.5, overall_risk NUMERIC(3,2) DEFAULT 0.5, risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')), factors JSONB DEFAULT '{}', recommendations TEXT, assessed_by UUID, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.digital_signatures (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'signed', 'rejected', 'expired')), file_url TEXT, created_by UUID REFERENCES public.salespeople(id), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), expires_at TIMESTAMP WITH TIME ZONE, signed_at TIMESTAMP WITH TIME ZONE);

CREATE TABLE IF NOT EXISTS public.document_signers (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, document_id UUID NOT NULL REFERENCES public.digital_signatures(id) ON DELETE CASCADE, name TEXT NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'rejected')), signed_at TIMESTAMP WITH TIME ZONE, sign_order INTEGER DEFAULT 1, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.price_history (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, supplier_product_id UUID REFERENCES public.supplier_products(id) ON DELETE CASCADE, product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE, old_price NUMERIC NOT NULL, new_price NUMERIC NOT NULL, recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.price_alerts (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, product_id UUID REFERENCES public.products(id) ON DELETE CASCADE, supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE, alert_type TEXT NOT NULL CHECK (alert_type IN ('price_drop', 'price_increase', 'new_best_price')), old_price NUMERIC, new_price NUMERIC NOT NULL, price_change_percent NUMERIC, is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.login_attempts (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, email TEXT NOT NULL, ip_address TEXT, user_agent TEXT, success BOOLEAN DEFAULT FALSE, failure_reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.rate_limit_logs (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, identifier TEXT NOT NULL, identifier_type TEXT NOT NULL DEFAULT 'ip', action TEXT NOT NULL, request_count INTEGER DEFAULT 1, window_start TIMESTAMPTZ DEFAULT NOW(), window_end TIMESTAMPTZ, blocked BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.blocked_ips (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, ip_address TEXT NOT NULL UNIQUE, reason TEXT NOT NULL, blocked_by UUID REFERENCES auth.users(id), blocked_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ, is_permanent BOOLEAN DEFAULT FALSE, block_count INTEGER DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.ip_whitelist (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, ip_address TEXT NOT NULL UNIQUE, description TEXT, added_by UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.rate_limit_settings (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, action TEXT NOT NULL UNIQUE, max_requests INTEGER NOT NULL DEFAULT 100, window_seconds INTEGER NOT NULL DEFAULT 3600, block_duration_seconds INTEGER NOT NULL DEFAULT 3600, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

CREATE TABLE IF NOT EXISTS public.active_sessions (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, session_token TEXT, ip_address TEXT, user_agent TEXT, device_info JSONB DEFAULT '{}', last_activity TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ);

CREATE TABLE IF NOT EXISTS public.user_mfa_settings (id UUID DEFAULT gen_random_uuid() PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, totp_enabled BOOLEAN DEFAULT FALSE, totp_secret TEXT, totp_verified_at TIMESTAMPTZ, sms_enabled BOOLEAN DEFAULT FALSE, phone_number TEXT, phone_verified_at TIMESTAMPTZ, backup_codes TEXT[], backup_codes_generated_at TIMESTAMPTZ, preferred_method TEXT DEFAULT 'totp' CHECK (preferred_method IN ('totp', 'sms')), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(user_id));
