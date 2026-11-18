-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321125638
-- nome:   salespro_mig_002_core_sales_complete

-- Salespeople with ALL columns (CREATE + ALTER TABLE columns)
CREATE TABLE IF NOT EXISTS public.salespeople (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, email TEXT UNIQUE, avatar_url TEXT,
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  role salesperson_role NOT NULL DEFAULT 'hybrid',
  auth_user_id UUID UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.salespeople ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Allow public read access to salespeople" ON public.salespeople FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Allow authenticated insert to salespeople" ON public.salespeople FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Allow authenticated update to salespeople" ON public.salespeople FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_salespeople_auth_user ON public.salespeople(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_salespeople_role ON public.salespeople(role);
CREATE INDEX IF NOT EXISTS idx_salespeople_active ON public.salespeople(is_active);

-- Sales with ALL columns
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL, product_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'pending', 'cancelled', 'negotiation', 'proposal', 'qualification', 'discovery')),
  category TEXT NOT NULL DEFAULT 'subscription' CHECK (category IN ('subscription', 'service', 'project', 'other')),
  salesperson_id UUID REFERENCES public.salespeople(id),
  source TEXT DEFAULT 'other',
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users,
  delete_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Allow public read access to sales" ON public.sales FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Allow authenticated insert to sales" ON public.sales FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Allow authenticated update to sales" ON public.sales FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Allow authenticated delete on sales" ON public.sales FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_sales_salesperson ON public.sales(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_source ON public.sales(source);

DO $$ BEGIN
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Daily metrics
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE, revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  revenue_goal DECIMAL(12,2) NOT NULL DEFAULT 0, new_clients INTEGER NOT NULL DEFAULT 0,
  total_sales INTEGER NOT NULL DEFAULT 0, conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_ticket DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Allow public read access to daily_metrics" ON public.daily_metrics FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Category metrics
CREATE TABLE IF NOT EXISTS public.category_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL, category TEXT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, category)
);
ALTER TABLE public.category_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "Allow public read access to category_metrics" ON public.category_metrics FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
