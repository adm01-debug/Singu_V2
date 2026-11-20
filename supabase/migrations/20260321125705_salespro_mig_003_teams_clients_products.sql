-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321125705
-- nome:   salespro_mig_003_teams_clients_products

CREATE TABLE IF NOT EXISTS public.sales_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesperson_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
  month DATE NOT NULL, goal_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(salesperson_id, month)
);
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "sales_goals_select" ON public.sales_goals FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sales_goals_insert" ON public.sales_goals FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sales_goals_update" ON public.sales_goals FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT,
  total_value NUMERIC NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP WITH TIME ZONE, deleted_by UUID REFERENCES auth.users, delete_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "clients_all" ON public.clients FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'subscription',
  price NUMERIC NOT NULL DEFAULT 0, sales_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "products_select" ON public.products FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, sdr_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true, inactivity_days INTEGER NOT NULL DEFAULT 365,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.team_closers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  closer_id UUID NOT NULL REFERENCES public.salespeople(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), UNIQUE(team_id, closer_id)
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_closers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "teams_select" ON public.teams FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "teams_all" ON public.teams FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "team_closers_select" ON public.team_closers FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "team_closers_all" ON public.team_closers FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.deal_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost')),
  reason TEXT NOT NULL, notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.deal_stage_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, entered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exited_at TIMESTAMP WITH TIME ZONE
);
CREATE TABLE IF NOT EXISTS public.deal_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  salesperson_id UUID REFERENCES public.salespeople(id) ON DELETE SET NULL,
  question TEXT NOT NULL, response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_chat_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "deal_outcomes_all" ON public.deal_outcomes FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deal_stage_history_all" ON public.deal_stage_history FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "deal_chat_all" ON public.deal_chat_history FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
