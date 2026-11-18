-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321123026
-- nome:   salespro_batch1_core_sales

CREATE TABLE IF NOT EXISTS public.salespeople (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE, avatar_url TEXT, commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00, is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sales (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, client_name TEXT NOT NULL, product_name TEXT NOT NULL, amount DECIMAL(12,2) NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'cancelled')), category TEXT NOT NULL DEFAULT 'subscription' CHECK (category IN ('subscription', 'service', 'project', 'other')), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.sales_goals (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, month DATE NOT NULL, goal_amount DECIMAL(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(salesperson_id, month));

CREATE TABLE IF NOT EXISTS public.daily_metrics (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, date DATE NOT NULL UNIQUE, revenue DECIMAL(12,2) NOT NULL DEFAULT 0, revenue_goal DECIMAL(12,2) NOT NULL DEFAULT 0, new_clients INTEGER NOT NULL DEFAULT 0, total_sales INTEGER NOT NULL DEFAULT 0, conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0, avg_ticket DECIMAL(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.category_metrics (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, date DATE NOT NULL, category TEXT NOT NULL, percentage DECIMAL(5,2) NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(date, category));

CREATE TABLE IF NOT EXISTS public.clients (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, total_value NUMERIC NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.products (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'subscription', price NUMERIC NOT NULL DEFAULT 0, sales_count INTEGER NOT NULL DEFAULT 0, rating NUMERIC NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'ativo', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.teams (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, name TEXT NOT NULL, sdr_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL, is_active BOOLEAN NOT NULL DEFAULT true, inactivity_days INTEGER NOT NULL DEFAULT 365, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.team_closers (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE, closer_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(team_id, closer_id));

CREATE TABLE IF NOT EXISTS public.user_roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, role app_role NOT NULL DEFAULT 'salesperson', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE (user_id, role));

CREATE TABLE IF NOT EXISTS public.permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, description text, resource text NOT NULL, action text NOT NULL, created_at timestamp with time zone NOT NULL DEFAULT now(), UNIQUE(resource, action));

CREATE TABLE IF NOT EXISTS public.role_permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), role app_role NOT NULL, permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE, created_at timestamp with time zone NOT NULL DEFAULT now(), UNIQUE(role, permission_id));

CREATE TABLE IF NOT EXISTS public.saved_filters (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, entity_type TEXT NOT NULL, name TEXT NOT NULL, filters JSONB NOT NULL DEFAULT '{}'::jsonb, is_default BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT unique_filter_name_per_user_entity UNIQUE (user_id, entity_type, name));

CREATE TABLE IF NOT EXISTS public.entity_versions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), entity_type TEXT NOT NULL, entity_id UUID NOT NULL, version_number INT NOT NULL, data JSONB NOT NULL DEFAULT '{}'::jsonb, changed_by UUID REFERENCES auth.users(id), changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), change_summary TEXT, CONSTRAINT unique_entity_version UNIQUE (entity_type, entity_id, version_number));

CREATE TABLE IF NOT EXISTS public.deal_outcomes (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE, salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE CASCADE, outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost')), reason TEXT NOT NULL, notes TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS public.deal_stage_history (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE, stage TEXT NOT NULL, entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), exited_at TIMESTAMP WITH TIME ZONE);

CREATE TABLE IF NOT EXISTS public.deal_chat_history (id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY, deal_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE, salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL, question TEXT NOT NULL, response TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now());
